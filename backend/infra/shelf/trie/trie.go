package trie

type Trie[T any] struct {
	value        T
	valuePresent bool
	children     map[byte]*Trie[T]
}

// Get returns the value stored in true for the given key as well as a boolean
// flag describing whether key has been found or not. If ok is false, t has
// the default value for T.
func Get[T any](trie *Trie[T], key []byte) (t T, ok bool) {
	node := trie
	for _, k := range key {
		node = node.children[k]
		if node == nil {
			return
		}
	}

	if !node.valuePresent {
		return
	}

	return node.value, true
}

// Subtrie returns the subtree of trie rooted at the node with key. It returns
// nil if key is not found in trie.
func Subtrie[T any](trie *Trie[T], key []byte) *Trie[T] {
	node := trie
	for _, k := range key {
		node = node.children[k]
		if node == nil {
			return nil
		}
	}

	return node
}

// Put adds a new value to trie using key and value. It returns true, if key
// previously existed in trie and thus its value got overwritten, false otherwise.
func Put[T any](trie *Trie[T], key []byte, value T) bool {
	node := trie
	for _, k := range key {
		if node.children == nil {
			node.children = make(map[byte]*Trie[T])
		}

		child, ok := node.children[k]
		if !ok {
			child = new(Trie[T])
			node.children[k] = child
		}
		node = child
	}

	newValue := node.valuePresent
	node.value = value
	node.valuePresent = true

	return newValue
}

// Delete removes the value associated with key from trie. It returns true if
// key was found and removed, false otherwise.
func Delete[T any](trie *Trie[T], key []byte) bool {
	// keep track of the parent for current node so we might remove the node
	var parent *Trie[T]
	var ok bool
	// start with the root node
	node := trie

	for _, k := range key {
		// if current node has no children, we've reached a leaf and can stop here
		if node.children == nil {
			return false
		}

		// remember the current node as the next parent
		parent = node
		// load the next node
		node, ok = node.children[k]
		if !ok {
			// if it's not present, we're done
			return false
		}
	}

	// if node has no children, we can remove it from parent
	if len(node.children) == 0 {
		delete(parent.children, key[len(key)-1])
		return true
	}

	// otherwise we just remove the value
	// mark the value as not being present
	node.valuePresent = false
	// and clear the value
	var empty T
	node.value = empty

	return true
}

// Keys returns an iterator that yields all keys in trie.
func Keys[T any](trie *Trie[T]) func(func([]byte) bool) {
	return func(yield func([]byte) bool) {
		type stackEntry struct {
			node *Trie[T]
			key  []byte
		}

		stack := []stackEntry{{node: trie, key: []byte{}}}

		for len(stack) > 0 {
			// Pop from stack
			entry := stack[len(stack)-1]
			stack = stack[:len(stack)-1]

			node := entry.node
			if node.valuePresent {
				if !yield(entry.key) {
					return
				}
			}

			// Push children to stack
			for k, child := range node.children {
				if child != nil {
					newKey := make([]byte, len(entry.key)+1)
					copy(newKey, entry.key)
					newKey[len(entry.key)] = k
					stack = append(stack, stackEntry{node: child, key: newKey})
				}
			}
		}
	}
}

type WalkFunc[T any] func(T) error

// Walk walks trie for all prefixes for key (including key itself) that carry
// a value and invokes walkFunc for each value. If walkFunc returns a non-nil
// error, walking is aborted and the error returned. Otherwise nil is returned.
func Walk[T any](trie *Trie[T], key []byte, walkFunc WalkFunc[T]) error {
	node := trie
	for _, k := range key {
		child, ok := node.children[k]
		if !ok {
			return nil
		}

		if child.valuePresent {
			if err := walkFunc(child.value); err != nil {
				return err
			}
		}
		node = child
	}

	return nil
}
