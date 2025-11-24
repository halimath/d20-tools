package grid

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/halimath/d20-tools/auth"
	"github.com/halimath/d20-tools/infra/shelf"
)

type Values struct {
	Label      string
	Descriptor string
}

type Grid struct {
	id           string
	ownerID      string
	LastModified time.Time
	// Version      int
	Values
}

func (g Grid) ID() string {
	return assembleID(g.ownerID, g.id)
}

type SubscriptionFunc func(Values)

var ErrForbidden = errors.New("forbidden")

type GridService struct {
	repo *Repository
}

func NewService(r *Repository) *GridService {
	return &GridService{
		repo: r,
	}
}

func (svc *GridService) List(ctx context.Context) ([]Grid, error) {
	principal := auth.FromContext(ctx)
	if principal == nil {
		return nil, ErrForbidden
	}

	return svc.repo.List(principal.ID)
}

func (svc *GridService) Create(ctx context.Context, v Values) (Grid, error) {
	principal := auth.FromContext(ctx)
	if principal == nil {
		return Grid{}, ErrForbidden
	}

	grid := Grid{
		id:           generateGridID(),
		ownerID:      principal.ID,
		LastModified: time.Now(),
		Values:       v,
	}

	return grid, svc.repo.Create(grid)
}

func (svc *GridService) Load(ctx context.Context, id string) (Grid, error) {
	ownerID, gridID, err := parseID(id)
	if err != nil {
		return Grid{}, err
	}

	return svc.repo.Load(ownerID, gridID)
}

func (svc *GridService) Update(ctx context.Context, id string, vals Values) error {
	principal := auth.FromContext(ctx)
	if principal == nil {
		return ErrForbidden
	}

	ownerID, gridID, err := parseID(id)
	if err != nil {
		return err
	}

	if ownerID != principal.ID {
		return ErrForbidden
	}

	original, err := svc.repo.Load(ownerID, gridID)
	if err != nil {
		return err
	}

	if original.ownerID != principal.ID {
		return ErrForbidden
	}

	grid := Grid{
		id:           gridID,
		ownerID:      principal.ID,
		LastModified: time.Now(),
		Values:       vals,
	}

	return svc.repo.Update(grid)
}

func (svc *GridService) Delete(ctx context.Context, id string) error {
	// TODO: Need a real shelf transaction here
	principal := auth.FromContext(ctx)
	if principal == nil {
		return ErrForbidden
	}

	ownerID, gridID, err := parseID(id)
	if err != nil {
		return err
	}

	if ownerID != principal.ID {
		return ErrForbidden
	}

	grid, err := svc.repo.Load(ownerID, gridID)
	if err != nil {
		return err
	}

	if grid.ownerID != principal.ID {
		return ErrForbidden
	}

	return svc.repo.Delete(ownerID, gridID)
}

type Subscription struct {
	s *shelf.Subscription
	c chan Grid
}

func (s *Subscription) Cancel() {
	s.s.Cancel()
}

func (s *Subscription) C() <-chan Grid {
	return s.c
}

func (svc *GridService) Subscribe(ctx context.Context, id string) (*Subscription, error) {
	ownerID, gridID, err := parseID(id)
	if err != nil {
		return nil, err
	}

	grid, err := svc.repo.Load(ownerID, gridID)
	if err != nil {
		return nil, err
	}

	sup := svc.repo.Subscribe(ctx, ownerID, gridID)
	sup.c <- grid

	return sup, nil
}

const idSeparator = ":"

var ErrInvalidID = errors.New("invalid id")

func parseID(id string) (ownerID, gridID string, err error) {
	parts := strings.Split(id, idSeparator)
	if len(parts) != 2 {
		return "", "", fmt.Errorf("%w: %q", ErrInvalidID, id)
	}
	return parts[0], parts[1], nil
}

func assembleID(ownerID, gridID string) string {
	return ownerID + idSeparator + gridID
}

func generateGridID() string {
	const idChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	const length = 24

	result := make([]byte, length)

	for i := 0; i < length; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(idChars))))
		if err != nil {
			panic(err)
		}
		result[i] = idChars[n.Int64()]
	}

	return string(result)
}
