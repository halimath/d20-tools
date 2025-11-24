package session

import (
	"context"
	"sync"
	"time"
)

type inMemorySession struct {
	id           string
	values       map[string]any
	lastAccessed time.Time
}

func NewInMemorySession() Session {
	return &inMemorySession{
		id:           NewSessionID(),
		values:       make(map[string]any),
		lastAccessed: time.Now(),
	}
}

func (ses *inMemorySession) ID() string {
	return ses.id
}

func (ses *inMemorySession) Get(key string) any {
	v, ok := ses.values[key]
	if !ok {
		return nil
	}

	return v
}

func (ses *inMemorySession) Set(key string, val any) {
	ses.values[key] = val
}

func (ses *inMemorySession) Delete(key string) {
	delete(ses.values, key)
}

func (ses *inMemorySession) LastAccessed() time.Time {
	return ses.lastAccessed
}

func (ses *inMemorySession) SetLastAccessed(la time.Time) {
	ses.lastAccessed = la
}

// --

type inMemoryStore struct {
	values map[string]Session
	lock   sync.RWMutex
	maxTTL time.Duration
	ctx    context.Context
}

type InMemoryStoreOption func(*inMemoryStore)

func WithMaxTTL(maxTTL time.Duration) InMemoryStoreOption {
	return func(ims *inMemoryStore) {
		ims.maxTTL = maxTTL
	}
}

func WithContext(ctx context.Context) InMemoryStoreOption {
	return func(ims *inMemoryStore) {
		ims.ctx = ctx
	}
}

// Creates a new in memory session store. Applies opts to customize the store.
//
// This function also spawns a goroutine that periodically checks for old-aged
// sessions and removes them. The default TTL for no access is 5 minutes. Use
// the [WithMaxTTL] option to customize this. Use the [WithContext] option to
// pass in a custom context and Cancel this context to stop the goroutine.
func NewInMemoryStore(opts ...InMemoryStoreOption) Store {
	s := &inMemoryStore{
		values: make(map[string]Session),
		maxTTL: 5 * time.Minute,
	}

	for _, opt := range opts {
		opt(s)
	}

	if s.ctx == nil {
		s.ctx = context.Background()
	}

	ticker := time.NewTicker(time.Minute)

	go func() {
		for {
			select {
			case <-ticker.C:
				// Perform the cleanup operation
				s.cleanup()
			case <-s.ctx.Done():
				// Context has been canceled; stop this goroutine
				return
			}
		}
	}()

	return s
}

func (s *inMemoryStore) cleanup() {
	s.lock.Lock()
	defer s.lock.Unlock()

	latestLA := time.Now().Add(-s.maxTTL)

	for _, ses := range s.values {
		la := ses.LastAccessed()
		if la.Before(latestLA) {
			delete(s.values, ses.ID())
		}
	}
}

func (s *inMemoryStore) Create() (ses Session, err error) {
	s.lock.Lock()
	defer s.lock.Unlock()

	ses = NewInMemorySession()
	s.values[ses.ID()] = ses

	return ses, nil
}

func (s *inMemoryStore) Load(id string) (Session, error) {
	s.lock.RLock()
	defer s.lock.RUnlock()

	ses, ok := s.values[id]
	if !ok {
		return nil, ErrSessionNotFound
	}
	return ses, nil
}

func (s *inMemoryStore) Store(ses Session) error {
	s.lock.Lock()
	defer s.lock.Unlock()

	s.values[ses.ID()] = ses
	return nil
}
