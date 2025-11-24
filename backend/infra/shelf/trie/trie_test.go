package trie

import (
	"errors"
	"math/rand"
	"slices"
	"testing"

	"github.com/halimath/expect"
	"github.com/halimath/expect/is"
)

func TestPut(t *testing.T) {
	root := &Trie[int]{}
	key := []byte("foo")

	val, ok := Get(root, key)
	expect.That(t,
		is.EqualTo(ok, false),
		is.EqualTo(0, val),
	)

	// Insert new key
	existed := Put(root, key, 42)
	expect.That(t, is.EqualTo(existed, false))

	// Insert same key again (overwrite)
	existed = Put(root, key, 99)
	expect.That(t, is.EqualTo(existed, true))

	// Check inserted value
	val, ok = Get(root, key)
	expect.That(t,
		is.EqualTo(ok, true),
		is.EqualTo(99, val),
	)
}

func TestGet(t *testing.T) {
	root := &Trie[string]{}
	Put(root, []byte("bar"), "baz")

	// Existing key
	val, ok := Get(root, []byte("bar"))
	expect.That(t,
		is.EqualTo(ok, true),
		is.EqualTo("baz", val),
	)

	// Non-existent key
	_, ok = Get(root, []byte("nope"))
	expect.That(t,
		is.EqualTo(ok, false),
	)

	// Key prefix (should fail unless exact match)
	_, ok = Get(root, []byte("ba"))
	expect.That(t,
		is.EqualTo(ok, false),
	)
}

func TestDelete(t *testing.T) {
	root := &Trie[int]{}
	Put(root, []byte("a"), 1)
	Put(root, []byte("ab"), 2)
	Put(root, []byte("abc"), 3)

	// Delete node with children (should remove only value)
	ok := Delete(root, []byte("ab"))
	expect.That(t,
		is.EqualTo(ok, true),
	)

	_, found := Get(root, []byte("ab"))
	expect.That(t,
		is.EqualTo(found, false),
	)

	val, found := Get(root, []byte("a"))
	expect.That(t,
		is.EqualTo(found, true),
		is.EqualTo(val, 1),
	)

	// Delete leaf node
	ok = Delete(root, []byte("abc"))
	expect.That(t,
		is.EqualTo(ok, true),
	)

	_, found = Get(root, []byte("abc"))
	expect.That(t,
		is.EqualTo(found, false),
	)

	// Delete non-existent key
	ok = Delete(root, []byte("zzz"))
	expect.That(t,
		is.EqualTo(ok, false),
	)
}

func TestKeys(t *testing.T) {
	trie := new(Trie[int])
	Put(trie, []byte("foo"), 17)
	Put(trie, []byte("bar"), 19)
	Put(trie, []byte("baz"), 21)
	Put(trie, []byte("foobar"), 23)

	keys := make([]string, 0, 4)
	for key := range Keys(trie) {
		keys = append(keys, string(key))
	}

	slices.Sort(keys)

	expect.That(t, is.DeepEqualTo(keys, []string{
		"bar", "baz", "foo", "foobar",
	}))
}

func TestWalk(t *testing.T) {
	tr := &Trie[string]{}

	Put(tr, []byte("c"), "c")
	Put(tr, []byte("ca"), "ca")
	Put(tr, []byte("cat"), "feline")
	Put(tr, []byte("car"), "vehicle")
	Put(tr, []byte("dog"), "canine")

	t.Run("cat", func(t *testing.T) {
		var got []string
		err := Walk(tr, []byte("cat"), func(v string) error {
			got = append(got, v)
			return nil
		})

		expect.That(t,
			is.NoError(err),
			is.DeepEqualTo(got, []string{"c", "ca", "feline"}),
		)
	})

	t.Run("non-existent key", func(t *testing.T) {
		var called bool
		err := Walk(tr, []byte("x"), func(v string) error {
			called = true
			return nil
		})
		expect.That(t,
			is.NoError(err),
			is.EqualTo(called, false),
		)
	})

	t.Run("walkFunc returns error", func(t *testing.T) {
		testErr := errors.New("stop walk")
		err := Walk(tr, []byte("c"), func(v string) error {
			return testErr
		})
		expect.That(t, is.Error(err, testErr))
	})
}

func BenchmarkPut(b *testing.B) {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	const strLen = 40
	const numStrings = 1000
	const iterations = 20000

	strings := make([]string, numStrings)
	for i := 0; i < numStrings; i++ {
		bs := make([]byte, strLen)
		for j := 0; j < strLen; j++ {
			bs[j] = charset[rand.Intn(len(charset))]
		}
		strings[i] = string(bs)
	}

	b.Run("trie", func(b *testing.B) {
		root := &Trie[int]{}
		for b.Loop() {
			for i := range iterations {
				Put(root, []byte(strings[i%len(strings)]), i)
			}
		}
	})
	b.Run("map", func(b *testing.B) {
		m := make(map[string]int)
		for b.Loop() {
			for i := range iterations {
				m[strings[i%len(strings)]] = i
			}
		}
	})
}
