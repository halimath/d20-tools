package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
	"time"

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
	logger := kvlog.New(kvlog.NewSyncHandler(os.Stdout, kvlog.JSONLFormatter())).
		AddHook(kvlog.TimeHook)

	logger.Logs("d20-tools starting", kvlog.WithKV("version", Version), kvlog.WithKV("build_date", BuildDate),
		kvlog.WithKV("vcs_ref", VCSRef), kvlog.WithKV("build_number", BuildNumber))

	mux := http.NewServeMux()
	mux.Handle("/.well-known/version-info.json", createVersionInfoHandler())
	mux.Handle("/", createFrontendHandler())

	logger.Logs("starting http", kvlog.WithKV("address", "localhost:8080"))

	if err := http.ListenAndServe(":8080", kvlog.Middleware(logger, true)(mux)); err != nil {
		logger.Logs("failed to start server", kvlog.WithErr(err))
	}
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

	return http.FileServer(http.FS(distFS))
}
