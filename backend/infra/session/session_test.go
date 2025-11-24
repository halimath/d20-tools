package session

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/halimath/expect"
	"github.com/halimath/expect/is"
)

func TestFromContext(t *testing.T) {
	ctx := context.Background()
	s := NewInMemorySession()

	ctx = withSession(ctx, s)

	got := FromContext(ctx)
	expect.That(t,
		is.DeepEqualTo(got, s),
	)
}

func TestGet(t *testing.T) {
	s := NewInMemorySession()
	s.Set("int", 42)
	s.Set("string", "hello")

	i := Get[int](s, "int")
	expect.That(t,
		is.EqualTo(42, i),
	)

	str := Get[string](s, "string")
	expect.That(t,
		is.EqualTo("hello", str),
	)

	missing := Get[int](s, "nope")
	expect.That(t,
		is.EqualTo(0, missing),
	)
}

func TestInMemoryStore(t *testing.T) {
	t.Run("get", func(t *testing.T) {

		store := NewInMemoryStore()

		s, err := store.Load("missing")
		expect.That(t,
			is.Error(err, ErrSessionNotFound),
			is.DeepEqualTo(nil, s),
		)
	})

	t.Run("get_set", func(t *testing.T) {
		store := NewInMemoryStore()
		s := NewInMemorySession()
		s.Set("x", 1)

		err := store.Store(s)
		expect.That(t,
			is.NoError(err),
		)

		got, err := store.Load(s.ID())
		expect.That(t,
			is.NoError(err),
			is.DeepEqualTo(got, s),
		)
	})
}

func TestMiddleware(t *testing.T) {

	t.Run("withCookieNameOption", func(t *testing.T) {
		h := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})

		mw := NewMiddleware(WithCookieName("mycookie"))(h)

		rw := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/", nil)

		mw.ServeHTTP(rw, req)

		cookies := rw.Result().Cookies()
		expect.That(t,
			is.EqualTo("mycookie", cookies[0].Name),
			is.SliceOfLen(rw.Result().Cookies(), 1),
		)
	})

	t.Run("withDefaultStore", func(t *testing.T) {
		h := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})

		mw := NewMiddleware()(h)

		// Assert session cookie is created
		rw := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/", nil)
		mw.ServeHTTP(rw, req)

		expect.That(t, is.SliceOfLen(rw.Result().Cookies(), 1))
	})

	t.Run("readExistingSession", func(t *testing.T) {
		store := NewInMemoryStore()
		ses, err := store.Create()
		expect.That(t, is.NoError(err))
		ses.Set("foo", "bar")

		h := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ses := FromContext(r.Context())
			got := ses.Get("foo")
			expect.That(t,
				is.EqualTo(got, "bar"),
			)
		})

		mw := NewMiddleware(WithStore(store), WithCookieName("sid"))(h)

		rw := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/", nil)
		req.AddCookie(&http.Cookie{Name: "sid", Value: ses.ID()})

		mw.ServeHTTP(rw, req)
	})

	t.Run("createNewSessionIfMissing", func(t *testing.T) {
		store := NewInMemoryStore()

		h := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ses := FromContext(r.Context())
			expect.That(t, is.StringOfLen(ses.ID(), 43))
		})

		mw := NewMiddleware(WithStore(store), WithCookieName("sid"))(h)

		rw := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/", nil)

		mw.ServeHTTP(rw, req)

		// Cookie should be set
		expect.That(t, is.SliceOfLen(rw.Result().Cookies(), 1))
	})
}
