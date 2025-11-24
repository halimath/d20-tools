package grid

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/halimath/d20-tools/infra/shelf"
	"github.com/halimath/kvlog"
)

type Repository struct {
	s *shelf.Shelf
}

var (
	ErrNotFound      = errors.New("not found")
	ErrAlreadyExists = errors.New("already exists")
)

type gridDBO struct {
	Label        string `json:"label"`
	Descriptor   string `json:"descriptor"`
	OwnerID      string `json:"owner_id"`
	LastModified int64  `json:"last_modified"`
}

func indexKey(ownerID string) []byte {
	return []byte("user/" + ownerID)
}

func gridKey(ownerID, gridID string) []byte {
	return []byte("user/" + ownerID + "/grid/" + gridID)
}

func splitKey(key []byte) (ownerID, id string) {
	parts := strings.Split(string(key), "/")
	if len(parts) == 2 {
		// only return ownerID
		return parts[1], ""
	}

	if len(parts) == 4 {
		return parts[1], parts[3]
	}

	panic(fmt.Sprintf("invalid key: %q", string(key)))
}

func NewRepository(s *shelf.Shelf) *Repository {
	return &Repository{s: s}
}

func (r *Repository) Create(grid Grid) error {
	d, err := marshal(grid)
	if err != nil {
		return err
	}

	err = r.s.Insert(gridKey(grid.ownerID, grid.id), d)
	if err != nil && errors.Is(err, shelf.ErrConflict) {
		return ErrAlreadyExists
	}
	return err
}

func (r *Repository) Load(ownerID, id string) (Grid, error) {
	d, ok := r.s.Get([]byte(gridKey(ownerID, id)))
	if !ok {
		return Grid{}, ErrNotFound
	}

	return unmarshal(id, d)
}

func (r *Repository) List(ownerID string) ([]Grid, error) {
	var grids []Grid
	for key := range r.s.Keys(indexKey(ownerID)) {
		_, id := splitKey(key)
		g, err := r.Load(ownerID, id)
		if err != nil {
			return nil, err
		}
		grids = append(grids, g)
	}

	return grids, nil
}

func (r *Repository) Update(grid Grid) error {
	d, err := marshal(grid)
	if err != nil {
		return err
	}

	err = r.s.Update([]byte(gridKey(grid.ownerID, grid.id)), d)
	if err != nil && errors.Is(err, shelf.ErrNotFound) {
		return ErrNotFound
	}
	return err
}

func (r *Repository) Delete(ownerID, id string) error {
	return r.s.Delete([]byte(gridKey(ownerID, id)))
}

func (r *Repository) Subscribe(ctx context.Context, ownerID, gridID string) *Subscription {
	logger := kvlog.FromContext(ctx)

	shelfSup := r.s.Subscribe([]byte(gridKey(ownerID, gridID)))

	sup := &Subscription{
		s: shelfSup,
		c: make(chan Grid, 4),
	}

	go func() {
		defer close(sup.c)

		for {
			select {
			case <-ctx.Done():
				// Context has been cancelled; cancel the upstream subscription
				// and return
				shelfSup.Cancel()
				return
			case evt, ok := <-shelfSup.C():
				if !ok {
					// Upstream channel has been closed, close the downstream
					// channel accordingly and exit.
					return
				}

				g, err := unmarshal(string(evt.Key), evt.Data)
				if err != nil {
					logger.Logs("invalid grid data received from subscription",
						kvlog.WithKV("ownerID", ownerID),
						kvlog.WithKV("gridID", gridID),
						kvlog.WithErr(err),
					)
					continue
				}
				sup.c <- g
			}
		}
	}()

	return sup
}

func marshal(grid Grid) ([]byte, error) {
	return json.Marshal(gridDBO{
		Label:        grid.Label,
		Descriptor:   grid.Descriptor,
		OwnerID:      grid.ownerID,
		LastModified: grid.LastModified.Unix(),
	})
}

func unmarshal(id string, data []byte) (g Grid, err error) {
	var d gridDBO
	err = json.Unmarshal(data, &d)
	if err != nil {
		return Grid{}, err
	}

	return Grid{
		id:           id,
		ownerID:      d.OwnerID,
		LastModified: time.Unix(d.LastModified, 0),

		Values: Values{
			Label:      d.Label,
			Descriptor: d.Descriptor,
		},
	}, nil
}
