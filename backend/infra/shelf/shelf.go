// Package shelf is a small in-process key-value database that persistently
// stores values of arbitrary bytes.
// shelf stores data persistently in a single file that is appended only. On
// startup, shelf reads the file and builds an in-memory projection of all data.
package shelf

import (
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"slices"
	"sync"

	"github.com/google/uuid"
	"github.com/halimath/d20-tools/infra/shelf/trie"
)

var (
	// Sentinel error value wrapped to all errors from shelf operations. Can be
	// used with errors.Is.
	ErrShelfOperationFailed = errors.New("shelf: a persisting operation failed")

	// Sentinel error value used to report insert conflicts.
	ErrConflict = errors.New("conflict")

	// Sentinel error value used to report updates on non existing keys.
	ErrNotFound = errors.New("not found")
)

// Reader defines a common interface for reading operations.
type Reader interface {
	// Get gets the data stored for the given key and returns it with a bool ok.
	Get(key []byte) ([]byte, bool)

	// Keys returns an iterator function to enumerate all keys that share the
	// keyPrefix. If keyPrefix is null the iterate enumerates _all_ keys in
	// this reader.
	Keys(keyPrefix []byte) func(func(key []byte) bool)
}

// Writer defines a common interface for writing operations.
type Writer interface {
	// Inserts key and data.
	// Returns ErrConflict if the key is already present.
	Insert(key, data []byte) error

	// Updates the data stored for key to data. Returns ErrNotFound if key does not
	// exist.
	Update(key, value []byte) error

	// Delete deletes the value associated with key. If no such key exists nil
	// is returned.
	Delete(key []byte) error
}

type record struct {
	data []byte
}

// Shelf defines the root type for persisting operations.
type Shelf struct {
	writer        io.Writer
	entries       *trie.Trie[*record]
	subscriptions *trie.Trie[*[]*Subscription]
	lock          sync.RWMutex
}

// OpenFile opens a new shelf using filename to persistently store data. If the
// file named filename already exists it is read to prefill the shelf. If
// the file named filename does not exist, this operation creates it.
func OpenFile(filename string) (*Shelf, error) {
	exists := false
	_, err := os.Stat(filename)
	if err == nil {
		exists = true
	} else if !errors.Is(err, os.ErrNotExist) {
		return nil, fmt.Errorf("%w: failed to open database: %v", ErrShelfOperationFailed, err)
	}

	if !exists {
		f, err := os.Create(filename)
		if err != nil {
			return nil, fmt.Errorf("%w: failed to create database: %v", ErrShelfOperationFailed, err)
		}
		return Open(f), nil
	}

	f, err := os.OpenFile(filename, os.O_RDWR|os.O_APPEND, 0x644)
	if err != nil {
		return nil, fmt.Errorf("%w: failed to open database: %v", ErrShelfOperationFailed, err)
	}
	s := Open(f)
	err = s.populate(f)

	return s, err
}

func Open(w io.Writer) *Shelf {
	return &Shelf{
		entries:       new(trie.Trie[*record]),
		subscriptions: new(trie.Trie[*[]*Subscription]),
		writer:        w,
	}
}

func (s *Shelf) populate(r io.Reader) error {
	for {
		op, key, data, err := readEntry(r)
		if err != nil {
			if errors.Is(err, io.EOF) {
				break
			}
			return fmt.Errorf("%w: failed to read database: %v", ErrShelfOperationFailed, err)
		}

		switch op {
		case opCodeDelete:
			trie.Delete(s.entries, key)
		case opCodeSet:
			trie.Put(s.entries, key, &record{data: data})
		}
	}

	return nil
}

// Close closes s and the underlying file.
func (s *Shelf) Close() error {
	s.lock.Lock()
	defer s.lock.Unlock()

	var err error
	if c, ok := s.writer.(io.Closer); ok {
		err = c.Close()
	}

	s.writer = nil
	s.entries = nil

	return err
}

// Keys returns an iterator that enumerates all keys stored in s.
func (s *Shelf) Keys(keyPrefix []byte) func(func([]byte) bool) {
	return func(yield func([]byte) bool) {
		s.lock.RLock()
		defer s.lock.RUnlock()

		root := s.entries

		if keyPrefix != nil {
			root = trie.Subtrie(s.entries, keyPrefix)
			if root == nil {
				return
			}
		}

		for key := range trie.Keys(root) {
			if keyPrefix != nil {
				buf := make([]byte, len(key)+len(keyPrefix))
				copy(buf, keyPrefix)
				copy(buf[len(keyPrefix):], key)
				key = buf
			}

			if !yield(key) {
				return
			}
		}
	}
}

// Get returns the data stored for key as well as an ok flag indicating whether
// the key exists or not.
func (s *Shelf) Get(key []byte) ([]byte, bool) {
	s.lock.RLock()
	defer s.lock.RUnlock()
	return get(key, s.entries)
}

// Insert inserts key into s using value. It returns ErrConflict, if key already
// exists.
func (s *Shelf) Insert(key, data []byte) error {
	s.lock.Lock()
	err := insert(key, data, s.entries, s.writer)
	s.lock.Unlock()

	if err != nil {
		return err
	}

	s.notify(&ChangeEvent{
		Type: Inserted,
		Key:  key,
		Data: data,
	})

	return nil
}

// Update updates key in s using value. It returns ErrNotFound, if key does not
// exist.
func (s *Shelf) Update(key, data []byte) error {
	s.lock.Lock()
	err := update(key, data, s.entries, s.writer)
	s.lock.Unlock()

	if err != nil {
		return err
	}

	s.notify(&ChangeEvent{
		Type: Updated,
		Key:  key,
		Data: data,
	})

	return nil
}

// Delete deletes the value associated with key.
func (s *Shelf) Delete(key []byte) error {
	s.lock.Lock()
	err := deleteKey(key, s.entries, s.writer)
	s.lock.Unlock()

	if err != nil {
		return err
	}

	s.notify(&ChangeEvent{
		Type: Deleted,
		Key:  key,
	})

	return nil
}

func (s *Shelf) notify(evt *ChangeEvent) {
	trie.Walk(s.subscriptions, evt.Key, func(subs *[]*Subscription) error {
		for _, sub := range *subs {
			sub.c <- evt
		}

		return nil
	})
}

// --

func get(key []byte, t *trie.Trie[*record]) ([]byte, bool) {
	r, ok := trie.Get(t, []byte(key))
	if !ok {
		return nil, false
	}

	data := make([]byte, len(r.data))
	copy(data, r.data)

	return data, ok
}

func insert(key, data []byte, t *trie.Trie[*record], w io.Writer) error {
	if _, ok := trie.Get(t, key); ok {
		return ErrConflict
	}

	return set(key, data, t, w)
}

func update(key, data []byte, t *trie.Trie[*record], w io.Writer) error {
	if _, ok := trie.Get(t, key); !ok {
		return ErrNotFound
	}

	return set(key, data, t, w)
}

func set(key, data []byte, t *trie.Trie[*record], w io.Writer) error {
	if data == nil {
		data = []byte{}
	}

	r := &record{
		data: make([]byte, len(data)),
	}
	copy(r.data, data)

	if w != nil {
		err := writeEntry(opCodeSet, key, data, w)
		if err != nil {
			return fmt.Errorf("%w: failed to set database key: %v", ErrShelfOperationFailed, err)
		}
	}

	trie.Put(t, key, r)
	return nil
}

func deleteKey(key []byte, t *trie.Trie[*record], w io.Writer) error {
	_, ok := trie.Get(t, []byte(key))
	if !ok {
		return nil
	}

	if w != nil {
		if err := writeEntry(opCodeDelete, key, nil, w); err != nil {
			return fmt.Errorf("%w: failed to delete database key: %v", ErrShelfOperationFailed, err)
		}
	}

	trie.Delete(t, []byte(key))

	return nil
}

// --

// type ReaderWriter interface {
// 	Reader
// 	Writer
// }

// type readTX struct {
// 	s *Shelf
// }

// func (tx *readTX) Get(key []byte) ([]byte, bool)       { return get(key, tx.s.entries) }
// func (tx *readTX) Keys() func(f func(key []byte) bool) { return tx.s.Keys() }

// func (s *Shelf) ReadTX(uow func(Reader) error) error {
// 	s.lock.RLock()
// 	defer s.lock.RUnlock()

// 	return uow(&readTX{s})
// }

// type readWriteTX struct {
// 	*readTX
// 	buf *bytes.Buffer
// }

// func (tx *readWriteTX) Insert(key, data []byte) error {
// 	return tx.s.insert(key, data, tx.buf)
// }

// func (tx *readWriteTX) Update(key, data []byte) error {
// 	return tx.s.update(key, data, tx.buf)
// }

// func (tx *readWriteTX) Delete(key []byte) error { return tx.s.delete(key, tx.buf) }

// func (s *Shelf) WriteTX(uow func(ReaderWriter) error) error {
// 	s.lock.Lock()
// 	defer s.lock.Unlock()

// 	tx := &readWriteTX{
// 		readTX: &readTX{s},
// 		buf:    new(bytes.Buffer),
// 	}

// 	// FIXME: ow

// 	err := uow(tx)
// 	if err != nil {
// 		return err
// 	}

// }

// --

type SubscriptionFunc func(key, data []byte)

type ChangeEventType int

const (
	Inserted ChangeEventType = iota
	Updated
	Deleted
)

type ChangeEvent struct {
	Type      ChangeEventType
	Key, Data []byte
}

type Subscription struct {
	s                         *Shelf
	keyPrefix, subscriptionID []byte
	c                         chan *ChangeEvent
}

func (s *Subscription) C() <-chan *ChangeEvent { return s.c }

func (s *Subscription) Cancel() {
	s.s.lock.Lock()
	defer s.s.lock.Unlock()

	subs, ok := trie.Get(s.s.subscriptions, s.keyPrefix)
	if !ok {
		panic(fmt.Sprintf("invalid state: no subscription for id prefix %v", s.keyPrefix))
	}

	for i := range *subs {
		if (*subs)[i] == s {
			*subs = slices.Delete(*subs, i, i+1)
			break
		}
	}

	trie.Put(s.s.subscriptions, s.keyPrefix, subs)
	close(s.c)
}

func (s *Shelf) Subscribe(keyPrefix []byte) *Subscription {
	id := uuid.Must(uuid.NewV7())
	sub := &Subscription{
		s:              s,
		keyPrefix:      make([]byte, len(keyPrefix)),
		subscriptionID: id[:],
		c:              make(chan *ChangeEvent, 4), // TODO: Make buffer size configurable
	}
	copy(sub.keyPrefix, keyPrefix)

	s.lock.Lock()
	defer s.lock.Unlock()

	subs, ok := trie.Get(s.subscriptions, keyPrefix)
	if !ok {
		s := make([]*Subscription, 0, 10)
		subs = &s
	}
	*subs = append(*subs, sub)
	trie.Put(s.subscriptions, keyPrefix, subs)

	return sub
}

func SubscribeFunc(s *Shelf, keyPrefix []byte, f SubscriptionFunc) *Subscription {
	sub := s.Subscribe(keyPrefix)

	go func() {
		for evt := range sub.c {
			f(evt.Key, evt.Data)
		}
	}()

	return sub
}

// ---

// GetJSON is a convenience function to return the value stored in r under key
// unmarshalled into v. It returns, whether key exists and any error from
// unmarshalling.
func GetJSON(r Reader, key []byte, v any) (bool, error) {
	data, ok := r.Get(key)
	if !ok {
		return false, nil
	}

	return true, json.Unmarshal(data, v)
}

// InsertJSON is a convenience function to set the value in w for key to the JSON
// marshalled data from v. It returns either an error from marshalling, setting
// or nil.
func InsertJSON(w Writer, key []byte, v any) error {
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}

	return w.Insert(key, data)
}

// UpdateJSON is a convenience function to set the value in w for key to the JSON
// marshalled data from v. It returns either an error from marshalling, setting
// or nil.
func UpdateJSON(w Writer, key []byte, v any) error {
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}

	return w.Update(key, data)
}

// ---

type opCode byte

const (
	opCodeDelete opCode = 0
	opCodeSet    opCode = 1
)

func writeEntry(op opCode, id, data []byte, w io.Writer) error {
	// write the op code
	_, err := w.Write([]byte{byte(op)})
	if err != nil {
		return err
	}

	// Write the length of record's id as an int64 using little endian
	err = binary.Write(w, binary.LittleEndian, int64(len(id)))
	if err != nil {
		return err
	}

	// write the id
	_, err = w.Write([]byte(id))
	if err != nil {
		return err
	}

	if op == opCodeDelete {
		return nil
	}

	// Write the length of record's data as an int64 using little endian
	err = binary.Write(w, binary.LittleEndian, int64(len(data)))
	if err != nil {
		return err
	}

	_, err = w.Write(data)

	return err
}

func readEntry(r io.Reader) (op opCode, id, data []byte, err error) {
	buf := make([]byte, 8)

	// Read the op code
	_, err = r.Read(buf[0:1])
	if err != nil {
		return
	}
	op = opCode(buf[0])

	// Read the id's length
	var l int64
	err = binary.Read(r, binary.LittleEndian, &l)
	if err != nil {
		return
	}

	// Read the id
	id = make([]byte, l)
	_, err = r.Read(id)
	if err != nil {
		return
	}

	if op == opCodeDelete {
		return
	}

	// Read data length
	err = binary.Read(r, binary.LittleEndian, &l)
	if err != nil {
		return
	}

	data = make([]byte, l)
	_, err = r.Read(data)

	return
}
