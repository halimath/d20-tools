package shelf

import (
	"bytes"
	"io"
	"os"
	"strconv"
	"sync"
	"testing"
	"time"

	"github.com/halimath/expect"
	"github.com/halimath/expect/is"
)

func TestShelf(t *testing.T) {
	tmpFile, err := os.CreateTemp("", "shelf_*.db")
	expect.That(t, expect.FailNow(is.NoError(err)))
	defer os.Remove(tmpFile.Name())

	err = tmpFile.Close()
	expect.That(t, expect.FailNow(is.NoError(err)))

	shelf, err := OpenFile(tmpFile.Name())
	expect.That(t, expect.FailNow(is.NoError(err)))

	key := []byte("key")

	_, ok := shelf.Get(key)
	expect.That(t, is.EqualTo(ok, false))

	err = shelf.Insert(key, []byte("hello, world"))
	expect.That(t, expect.FailNow(is.NoError(err)))

	data, ok := shelf.Get(key)
	expect.That(t,
		is.EqualTo(ok, true),
		is.DeepEqualTo(data, []byte("hello, world")),
	)

	err = shelf.Close()
	expect.That(t, expect.FailNow(is.NoError(err)))

	stat, err := os.Stat(tmpFile.Name())
	expect.That(t,
		expect.FailNow(is.NoError(err)),
		is.EqualTo(stat.Size(), 1+8+3+8+12),
	)

	// reopen shelf to read entries
	shelf, err = OpenFile(tmpFile.Name())
	expect.That(t, expect.FailNow(is.NoError(err)))

	data, ok = shelf.Get(key)
	expect.That(t,
		is.EqualTo(ok, true),
		is.DeepEqualTo(data, []byte("hello, world")),
	)

	err = shelf.Delete(key)
	expect.That(t, expect.FailNow(is.NoError(err)))

	_, ok = shelf.Get(key)
	expect.That(t, is.EqualTo(ok, false))

	err = shelf.Close()
	expect.That(t, expect.FailNow(is.NoError(err)))

	stat, err = os.Stat(tmpFile.Name())
	expect.That(t,
		expect.FailNow(is.NoError(err)),
		is.EqualTo(stat.Size(), 1+8+3+8+12+1+8+3),
	)
}

func TestShelf_Keys(t *testing.T) {
	shelf := Open(nil)
	defer shelf.Close()

	err := shelf.Insert([]byte("abc"), []byte("abc"))
	expect.That(t, is.NoError(err))

	err = shelf.Insert([]byte("abd"), []byte("abd"))
	expect.That(t, is.NoError(err))

	err = shelf.Insert([]byte("abe"), []byte("abe"))
	expect.That(t, is.NoError(err))

	err = shelf.Insert([]byte("foo"), []byte("bar"))
	expect.That(t, is.NoError(err))

	t.Run("nilPrefix", func(t *testing.T) {
		var keys []string
		for k := range shelf.Keys(nil) {
			keys = append(keys, string(k))
		}
		expect.That(t, is.SliceContaining(keys,
			"foo", "abc", "abd", "abe",
		))
	})
	t.Run("nonNilPrefix", func(t *testing.T) {
		var keys []string
		for k := range shelf.Keys([]byte("ab")) {
			keys = append(keys, string(k))
		}
		t.Logf("%+v", keys)
		expect.That(t, is.SliceContaining(keys,
			"abc", "abd", "abe",
		))
	})
}

func TestGetJSON(t *testing.T) {
	shelf := Open(nil)
	defer shelf.Close()

	id := []byte("key")

	type paloadType struct {
		Foo string `json:"foo"`
		Bar string `json:"bar"`
	}

	payload := paloadType{
		Foo: "foo", Bar: "bar",
	}

	err := InsertJSON(shelf, id, payload)
	expect.That(t, expect.FailNow(is.NoError(err)))

	var got paloadType
	ok, err := GetJSON(shelf, id, &got)
	expect.That(t,
		expect.FailNow(is.NoError(err)),
		is.EqualTo(ok, true),
		is.DeepEqualTo(got, payload),
	)
}

func TestShelf_concurrency(t *testing.T) {
	const (
		concurrencyLevel = 200
		repetitions      = 1000
	)

	shelf := Open(nil)
	defer shelf.Close()

	var wg sync.WaitGroup

	for c := range concurrencyLevel {
		wg.Go(func() {
			id := []byte(strconv.Itoa(c))

			_, ok := shelf.Get(id)
			expect.That(t, is.EqualTo(ok, false))

			for i := range repetitions {
				var data []byte
				if i%2 == 0 {
					data = []byte("foo")
				} else {
					data = []byte("bar")
				}

				var err error
				if i == 0 {
					err = shelf.Insert(id, data)
				} else {
					err = shelf.Update(id, data)
				}
				expect.That(t, expect.FailNow(is.NoError(err)))

				data, ok := shelf.Get(id)
				expect.That(t,
					is.EqualTo(ok, true),
					is.DeepEqualTo(data, data),
				)
			}
		})
	}
	wg.Wait()

	count := 0
	for range shelf.Keys(nil) {
		count += 1
	}
	expect.That(t, is.EqualTo(count, concurrencyLevel))
}

func TestShelf_Subscribe(t *testing.T) {
	shelf := Open(nil)
	defer shelf.Close()

	var updatedIDs []string

	s := SubscribeFunc(shelf, []byte("ab"), func(id, _ []byte) {
		updatedIDs = append(updatedIDs, string(id))
	})

	shelf.Insert([]byte("a"), nil)
	shelf.Insert([]byte("ab"), nil)
	shelf.Insert([]byte("abc"), nil)
	shelf.Insert([]byte("abcd"), nil)
	shelf.Insert([]byte("f"), nil)

	s.Cancel()

	err := shelf.Insert([]byte("abcde"), nil)
	expect.That(t, is.NoError(err))

	time.Sleep(10 * time.Millisecond)

	expect.That(t,
		is.DeepEqualTo(updatedIDs, []string{
			"ab", "abc", "abcd",
		}),
	)
}

func TestReadEntry(t *testing.T) {
	id := []byte("key")

	data := []byte("hello, world")
	buf := new(bytes.Buffer)

	err := writeEntry(opCodeSet, id, data, buf)
	expect.That(t, expect.FailNow(is.NoError(err)))

	err = writeEntry(opCodeDelete, id, nil, buf)
	expect.That(t, expect.FailNow(is.NoError(err)))

	got := buf.Len()
	want := 1 + 8 + 3 + 8 + 12 + 1 + 8 + 3
	expect.That(t, is.EqualTo(got, want))

	//
	op, idRead, dataRead, err := readEntry(buf)
	expect.That(t,
		expect.FailNow(is.NoError(err)),
		is.EqualTo(op, opCodeSet),
		is.DeepEqualTo(idRead, id),
		is.DeepEqualTo(dataRead, data),
	)

	op, idRead, dataRead, err = readEntry(buf)
	expect.That(t,
		expect.FailNow(is.NoError(err)),
		is.EqualTo(op, opCodeDelete),
		is.DeepEqualTo(idRead, id),
		is.DeepEqualTo(dataRead, nil),
	)
	_, _, _, err = readEntry(buf)
	expect.That(t, is.Error(err, io.EOF))
}
