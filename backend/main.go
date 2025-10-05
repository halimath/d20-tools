package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"

	"github.com/halimath/kvlog"
)

var (
	Version     string
	BuildDate   string
	VCSRef      string
	BuildNumber string
)

func main() {
	logger := kvlog.New(kvlog.NewSyncHandler(os.Stdout, kvlog.JSONLFormatter())).
		AddHook(kvlog.TimeHook)

	logger.Logs("d20-tools starting", kvlog.WithKV("version", Version), kvlog.WithKV("build_date", BuildDate),
		kvlog.WithKV("vcs_ref", VCSRef), kvlog.WithKV("build_number", BuildNumber))

	mux := http.NewServeMux()
	mux.Handle("/", frontendHandler())

	logger.Logs("starting http", kvlog.WithKV("address", "localhost:8080"))

	if err := http.ListenAndServe(":8080", kvlog.Middleware(logger, true)(mux)); err != nil {
		logger.Logs("failed to start server", kvlog.WithErr(err))
	}
}

//go:embed dist
var frontend embed.FS

func frontendHandler() http.Handler {
	// Create a sub-filesystem pointing to the embedded "dist" folder
	distFS, err := fs.Sub(frontend, "dist")
	if err != nil {
		log.Fatal(err)
	}

	return http.FileServer(http.FS(distFS))
}
