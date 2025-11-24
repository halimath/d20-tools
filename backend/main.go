package main

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/halimath/d20-tools/auth"
	"github.com/halimath/d20-tools/config"
	"github.com/halimath/d20-tools/grid"
	"github.com/halimath/d20-tools/infra/session"
	"github.com/halimath/d20-tools/infra/shelf"
	"github.com/halimath/httputils/response"
	"github.com/halimath/kvlog"
)

var (
	Version     string = "0.0.0"
	BuildDate   string = time.Now().Format(time.RFC3339)
	VCSRef      string = "local"
	BuildNumber string = "0"
)

func main() {
	logger := kvlog.L

	ctx, cancel := context.WithCancel(context.Background())
	ctx = kvlog.ContextWithLogger(ctx, logger)

	signalCh := make(chan os.Signal, 1)
	signal.Notify(signalCh, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		s := <-signalCh
		logger.Logs("received signal; initiating shut down", kvlog.WithKV("signal", s))
		cancel()
	}()

	os.Exit(runService(ctx))
}

func runService(ctx context.Context) int {
	logger := kvlog.FromContext(ctx)

	logger.Logs("d20-tools starting", kvlog.WithKV("version", Version), kvlog.WithKV("build_date", BuildDate),
		kvlog.WithKV("vcs_ref", VCSRef), kvlog.WithKV("build_number", BuildNumber))

	cfg, err := config.New()
	if err != nil {
		logger.Logs("configuration error", kvlog.WithErr(err))
		os.Exit(1)
	}

	authHandler, err := auth.New(context.Background(), cfg.OAuth)
	if err != nil {
		logger.Logs("auth configuration error", kvlog.WithErr(err))
		os.Exit(2)
	}

	shlf, err := shelf.OpenFile(cfg.GridDBPath)
	if err != nil {
		logger.Logs("db configuration error", kvlog.WithErr(err))
		os.Exit(3)
	}

	gridRepo := grid.NewRepository(shlf)
	gridSrv := grid.NewService(gridRepo)

	sessionStore := session.NewInMemoryStore(session.WithMaxTTL(time.Hour))

	if cfg.DevMode {
		s := session.NewInMemorySession()
		s.Set(auth.PrincipalSessionKey, &auth.Principal{
			ID:   "foobar",
			Name: "Dev Mode User",
		})
		sessionStore.Store(s)
		logger.Logf("DEV_MODE has been set. Adding dummy session with id %q", s.ID())
	}

	sessionMW := session.NewMiddleware(session.WithStore(sessionStore))

	mux := http.NewServeMux()
	mux.Handle("/.well-known/version-info.json", createVersionInfoHandler())
	mux.Handle("/", createFrontendHandler())
	mux.Handle("/api/grid/", sessionMW(http.StripPrefix("/api/grid", grid.Handler(gridSrv))))
	mux.Handle("/auth/", sessionMW(http.StripPrefix("/auth", authHandler)))

	logger.Logs("starting http", kvlog.WithKV("port", cfg.HTTPPort))
	httpServer := http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.HTTPPort),
		Handler: kvlog.Middleware(logger, true)(mux),
	}

	termChan := make(chan int, 1)

	go func() {
		kvlog.L.Logs("http listen", kvlog.WithKV("addr", cfg.HTTPPort))
		err := httpServer.ListenAndServe()
		if err != http.ErrServerClosed {
			kvlog.L.Logs("http server failed to start", kvlog.WithErr(err))
			termChan <- 1
			return
		}

		termChan <- 0
	}()

	go func() {
		<-ctx.Done()

		kvlog.L.Logs("shutting done HTTP")
		httpServer.Close()

		kvlog.L.Logs("shutting done shelf")
		shlf.Close()
	}()

	exitCode := <-termChan
	close(termChan)

	kvlog.L.Logs("exit", kvlog.WithKV("code", exitCode))
	return exitCode
}

// --

type BuildInfo struct {
	Version     string `json:"version"`
	BuildDate   string `json:"build_date"`
	VCSRef      string `json:"vcs_ref"`
	BuildNumber string `json:"build_number"`
}

func createVersionInfoHandler() http.Handler {
	buildInfo := BuildInfo{
		Version:     Version,
		BuildDate:   BuildDate,
		VCSRef:      VCSRef,
		BuildNumber: BuildDate,
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response.JSON(w, r, buildInfo)
	})
}

// --

//go:embed dist
var frontend embed.FS

func createFrontendHandler() http.Handler {
	// Create a sub-filesystem pointing to the embedded "dist" folder
	distFS, err := fs.Sub(frontend, "dist")
	if err != nil {
		log.Fatal(err)
	}

	staticServer := http.FileServer(http.FS(distFS))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		if strings.HasPrefix(path, "/grid/") {
			path = "/grid/"
		}

		r.URL.Path = path

		staticServer.ServeHTTP(w, r)
	})

}
