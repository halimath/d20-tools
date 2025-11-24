package session

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/halimath/kvlog"
)

// Private type for the context key
type contextKeyType string

// Sentinel value used as the context key to hold the [Session].
const contextKey contextKeyType = "contextKey"

// FromContext returns the Session associated with ctx. If it does not exist,
// a nil Session is returned.
func FromContext(ctx context.Context) Session {
	v := ctx.Value(contextKey)
	if v == nil {
		return nil
	}

	s, ok := v.(Session)
	if !ok {
		panic(fmt.Sprintf("weired non session value found in context: %v", s))
	}
	return s
}

// withSession wraps s inside a [context.Context] using ctx as its parent and
// returns this context.
func withSession(ctx context.Context, s Session) context.Context {
	return context.WithValue(ctx, contextKey, s)
}

// --

// Session defines the interface for all session implementations. The design of
// this interface supports different implementations that include lazy loading
// or remote storing.
type Session interface {
	// ID returns the session’s ID.
	ID() string

	// Get gets the value associated with key from the Session and returns it
	// if found. The key is not found nil is returned.
	Get(key string) any

	// Set sets the value associated with key to val.
	Set(key string, val any)

	// Delete deletes key from this session.
	Delete(key string)

	// LastAccessed returnes the time stamp this session has been last accessed.
	LastAccessed() time.Time

	// Updates the last accessed timestamp for this session.
	SetLastAccessed(time.Time)
}

// --

// Get is a generic convenience to get and convert a value from a [Session].
// If key is not found in s or if the value for key in s is not of type T,
// T’s default value is returned.
func Get[T any](s Session, key string) (t T) {
	val := s.Get(key)
	if val == nil {
		return
	}

	t, _ = val.(T)
	return
}

// --

var ErrSessionNotFound = errors.New("session not found")

// Store defines the interface for session backend storage. It’s the store’s
// responsibility to synchronize concurrent access accordingly.
type Store interface {
	// Create creates a new session, stores it in this store and returns it.
	Create() (ses Session, err error)

	// Get retrieves the session associated with id and returns it. If id is
	// not found, [ErrSessionNotFound] is returned. If an error occurs while
	// looking up the session, a non-nil error is returned.
	Load(id string) (Session, error)

	// Set sets the session for id to s. If id already exists its value gets
	// overwritten. It returns an error if the operation cannot be performed.
	Store(s Session) error
}

// --

type middleware struct {
	store      Store
	cookieName string
	cookiePath string
}

// Option defines a mutator type to configure a middleware.
type Option func(*middleware)

// WithStore is an [Options] that configures the [Store] to use.
func WithStore(s Store) Option {
	return func(m *middleware) {
		m.store = s
	}
}

// WithCookieName is an [Option] that sets the cookie name.
func WithCookieName(cookieName string) Option {
	return func(m *middleware) {
		m.cookieName = cookieName
	}
}

// WithCookiePath is an [Option] that sets the cookie’s path attribute. The
// default value is /.
func WithCookiePath(path string) Option {
	return func(m *middleware) {
		m.cookiePath = path
	}
}

// NewMiddleware creates a new HTTP middleware wrapping h that adds session
// management. By default, the [Store] in use is an in-memory store and the
// cookie name defaults to "_session". Use opts to further configure the
// middleware.
//
// The middleware adds the [Session] associated with each request to the
// request’s context; use [FromContext] function to extract the session from
// this context.
func NewMiddleware(opts ...Option) func(http.Handler) http.Handler {
	mw := &middleware{
		cookieName: "_session",
		cookiePath: "/",
	}

	for _, opt := range opts {
		opt(mw)
	}

	if mw.store == nil {
		mw.store = NewInMemoryStore()
	}

	return func(handler http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			logger := kvlog.FromContext(r.Context())

			var ses Session
			var err error

			cookie, err := r.Cookie(mw.cookieName)
			if err != http.ErrNoCookie {
				id := cookie.Value
				ses, err = mw.store.Load(id)
				if err != nil {
					if !errors.Is(err, ErrSessionNotFound) {
						logger.Logs("failed to load session from store", kvlog.WithKV("id", id), kvlog.WithErr(err))

						http.Error(w, "internal server error", http.StatusInternalServerError)
						return
					}
					logger.Logs("Session with id not found", kvlog.WithKV("id", id))
				}
			}

			if ses == nil {
				ses, err = mw.store.Create()
				if err != nil {
					logger.Logs("failed to create new session", kvlog.WithErr(err))

					http.Error(w, "internal server error", http.StatusInternalServerError)
					return
				}
				logger.Logs("no previous session found; creating new one", kvlog.WithKV("id", ses.ID()))

				http.SetCookie(w, &http.Cookie{
					Name:     mw.cookieName,
					Value:    ses.ID(),
					HttpOnly: true,
					Path:     mw.cookiePath,
					Secure:   r.URL.Scheme == "https",
					// TODO: Add more customization options
				})
			}

			ses.SetLastAccessed(time.Now())

			ctx := r.Context()
			r = r.WithContext(withSession(ctx, ses))

			handler.ServeHTTP(w, r)

			err = mw.store.Store(ses)
			if err != nil {
				// The response has already been commenced and we cannot send an error,
				// so we just log the error
				logger.Logs("failed to store session from store", kvlog.WithKV("id", ses.ID()), kvlog.WithErr(err))
			}
		})
	}
}

// --

const sessionIDBytes = 32 // 32 bytes = 256 bits of entropy

// NewSessionID generates a cryptographically secure.
func NewSessionID() string {
	buf := make([]byte, sessionIDBytes)

	_, err := rand.Read(buf)
	if err != nil {
		panic(fmt.Sprintf("unable to generate session id: %v", err))
	}

	return base64.RawURLEncoding.EncodeToString(buf)
}
