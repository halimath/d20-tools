package grid

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/halimath/d20-tools/auth"
	"github.com/halimath/httputils/response"
	"github.com/halimath/kvlog"
)

type (
	WriteDTO struct {
		Label      string `json:"label"`
		Descriptor string `json:"descriptor"`
	}

	ReadDTO struct {
		WriteDTO
		ID           string `json:"id"`
		LastModified string `json:"lastModified"`
	}
)

func Handler(srv *GridService) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("POST /", func(w http.ResponseWriter, r *http.Request) {
		if auth.FromRequest(r) == nil {
			response.PlainText(w, r, "unauthorized", response.StatusCode(http.StatusUnauthorized))
			return
		}

		logger := kvlog.FromContext(r.Context())

		dto, err := readJSONBody[WriteDTO](w, r)
		if err != nil {
			// Error has already been handled
			return
		}

		logger.Logs("creating grid")

		grid, err := srv.Create(r.Context(), Values(dto))

		if err != nil {
			if errors.Is(err, ErrAlreadyExists) {
				http.Error(w, "grid already exists", http.StatusConflict)
				return
			}

			logger.Logs("error creating grid", kvlog.WithErr(err))
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		response.PlainText(w, r, grid.ID(), response.StatusCode(http.StatusCreated))
	})

	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		if auth.FromRequest(r) == nil {
			response.PlainText(w, r, "unauthorized", response.StatusCode(http.StatusUnauthorized))
			return
		}

		logger := kvlog.FromContext(r.Context())
		logger.Logs("loading all grids for user")

		grids, err := srv.List(r.Context())
		if err != nil {
			logger.Logs("failed to list grids for user", kvlog.WithErr(err))
			http.Error(w, "internal server error", http.StatusInternalServerError)
		}

		dtos := make([]ReadDTO, len(grids))
		for i, grid := range grids {
			dtos[i] = toDTO(grid)
		}

		response.JSON(w, r, dtos)
	})

	mux.HandleFunc("GET /{id}", func(w http.ResponseWriter, r *http.Request) {
		logger := kvlog.FromContext(r.Context())
		id := r.PathValue("id")
		logger.Logs("loading grid", kvlog.WithKV("id", id))

		g, err := srv.Load(r.Context(), id)
		if err != nil {
			if errors.Is(err, ErrNotFound) {
				http.Error(w, "not found", http.StatusNotFound)
				return
			}

			logger.Logs("failed to load grid", kvlog.WithKV("id", id), kvlog.WithErr(err))
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		response.JSON(w, r, toDTO(g))
	})

	mux.HandleFunc("PUT /{id}", func(w http.ResponseWriter, r *http.Request) {
		if auth.FromRequest(r) == nil {
			response.PlainText(w, r, "unauthorized", response.StatusCode(http.StatusUnauthorized))
			return
		}

		logger := kvlog.FromContext(r.Context())

		id := r.PathValue("id")

		dto, err := readJSONBody[WriteDTO](w, r)
		if err != nil {
			// Error has already been handled
			return
		}

		logger.Logs("updating grid", kvlog.WithKV("id", id))

		err = srv.Update(r.Context(), id, Values(dto))

		if err != nil {
			if errors.Is(err, ErrNotFound) {
				http.Error(w, "grid not found", http.StatusNotFound)
				return
			}

			if errors.Is(err, ErrForbidden) {
				http.Error(w, "forbidden", http.StatusForbidden)
				return
			}

			logger.Logs("error updating grid", kvlog.WithKV("id", id), kvlog.WithErr(err))
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		response.NoContent(w, r)
	})

	mux.HandleFunc("DELETE /{id}", func(w http.ResponseWriter, r *http.Request) {
		if auth.FromRequest(r) == nil {
			response.PlainText(w, r, "unauthorized", response.StatusCode(http.StatusUnauthorized))
			return
		}

		logger := kvlog.FromContext(r.Context())
		id := r.PathValue("id")
		logger.Logs("deleting grid", kvlog.WithKV("id", id))

		err := srv.Delete(r.Context(), id)
		if err != nil {
			if errors.Is(err, ErrNotFound) {
				http.Error(w, "not found", http.StatusNotFound)
				return
			}

			if errors.Is(err, ErrForbidden) {
				http.Error(w, "forbidden", http.StatusForbidden)
				return
			}

			logger.Logs("failed to delete grid", kvlog.WithKV("id", id), kvlog.WithErr(err))
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		response.NoContent(w, r)
	})

	mux.HandleFunc("GET /{id}/subscribe", func(w http.ResponseWriter, r *http.Request) {
		logger := kvlog.FromContext(r.Context())
		id := r.PathValue("id")
		logger.Logs("subscribing to grid", kvlog.WithKV("id", id))

		sup, err := srv.Subscribe(r.Context(), id)
		if err != nil {
			logger.Logs("failed to subscribe to grid", kvlog.WithKV("id", id), kvlog.WithErr(err))
			if errors.Is(err, ErrNotFound) {
				http.Error(w, "not found", http.StatusNotFound)
				return
			}
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		for g := range sup.C() {
			lastGridUpdateBytes, err := json.Marshal(toDTO(g))
			if err != nil {
				logger.Logs("failed to marshal grid", kvlog.WithKV("id", id), kvlog.WithErr(err))
				http.Error(w, "internal server error", http.StatusInternalServerError)
				return
			}

			fmt.Fprintf(w, "data: %s\n\n", string(lastGridUpdateBytes))
			w.(http.Flusher).Flush()
		}
	})

	return mux
}

var errNoJSON = errors.New("not a JSON response")

func readJSONBody[T any](w http.ResponseWriter, r *http.Request) (t T, err error) {
	logger := kvlog.FromContext(r.Context())
	contentType := r.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "application/json") {
		logger.Logs("unsupported media type", kvlog.WithKV("contentType", contentType))
		http.Error(w, "not a JSON response", http.StatusUnsupportedMediaType)
		return t, errNoJSON
	}

	var data []byte
	data, err = io.ReadAll(r.Body)
	if err != nil {
		logger.Logs("i/o error reading request body", kvlog.WithErr(err))
		return
	}

	err = json.Unmarshal(data, &t)
	if err != nil {
		logger.Logs("json unmarshalling error", kvlog.WithErr(err))
		http.Error(w, "invalid JSON bodz", http.StatusBadRequest)
		return
	}
	return
}

func toDTO(g Grid) ReadDTO {
	return ReadDTO{
		WriteDTO: WriteDTO{
			Label:      g.Label,
			Descriptor: g.Descriptor,
		},
		ID:           g.ID(),
		LastModified: g.LastModified.Format(time.RFC3339),
	}
}
