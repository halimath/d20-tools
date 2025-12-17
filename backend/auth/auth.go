package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net/http"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/halimath/d20-tools/config"
	"github.com/halimath/httputils/response"
	"github.com/halimath/httputils/session"
	"github.com/halimath/kvlog"
	"golang.org/x/oauth2"
)

const stateSessionKey = "auth.state"
const redirectTargetSessionKey = "auth.redirectTarget"
const PrincipalSessionKey = "auth.principal"

type Principal struct {
	ID   string
	Name string
}

func FromRequest(r *http.Request) *Principal {
	return FromContext(r.Context())
}

func FromContext(ctx context.Context) *Principal {
	ses := session.FromContext(ctx)
	if ses == nil {
		return nil
	}
	return FromSession(ses)
}

func FromSession(ses session.Session) *Principal {
	return session.Get[*Principal](ses, PrincipalSessionKey)
}

func New(ctx context.Context, cfg config.OAuthConfig) (http.Handler, error) {
	provider, err := oidc.NewProvider(ctx, cfg.ProviderURL)
	if err != nil {
		return nil, err
	}

	oauth2Config := oauth2.Config{
		ClientID:     cfg.ClientID,
		ClientSecret: cfg.ClientSecret,
		RedirectURL:  cfg.RedirectURL,
		Endpoint:     provider.Endpoint(),
		Scopes:       []string{oidc.ScopeOpenID, "profile"},
	}
	verifier := provider.Verifier(&oidc.Config{ClientID: cfg.ClientID})

	mux := http.NewServeMux()

	mux.HandleFunc("GET /login", func(w http.ResponseWriter, r *http.Request) {
		ses := session.FromContext(r.Context())

		state := generateStateToken(32)
		ses.Set(stateSessionKey, state)

		redirectTarget := r.URL.Query().Get("r")
		if redirectTarget == "" {
			redirectTarget = "/"
		}
		ses.Set(redirectTargetSessionKey, redirectTarget)

		http.Redirect(w, r, oauth2Config.AuthCodeURL(state, oauth2.SetAuthURLParam("redirect_uri", cfg.RedirectURL)), http.StatusFound)
	})

	mux.HandleFunc("GET /return", func(w http.ResponseWriter, r *http.Request) {
		logger := kvlog.FromContext(r.Context())

		// Verify state and errors.
		ses := session.FromContext(r.Context())
		stateFromSession := ses.Get(stateSessionKey)
		if stateFromSession == nil {
			logger.Logs("no state token in session", kvlog.WithErr(err))
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		stateFromReq := r.URL.Query().Get("state")
		if stateFromReq != stateFromSession {
			logger.Logs("state token from session does not match state token from request")
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		// Delete the state from session. We do not care about any error here.
		ses.Delete(stateSessionKey)

		oauth2Token, err := oauth2Config.Exchange(ctx, r.URL.Query().Get("code"))
		if err != nil {
			logger.Logs("failed to exchange OAuth code", kvlog.WithErr(err))
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		// Extract the ID Token from OAuth2 token.
		rawIDToken, ok := oauth2Token.Extra("id_token").(string)
		if !ok {
			logger.Logs("missing oidc token in token exchange response")
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		// Parse and verify ID Token payload.
		idToken, err := verifier.Verify(ctx, rawIDToken)
		if err != nil {
			logger.Logs("invalid oidc token", kvlog.WithErr(err))
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		// Extract custom claims
		var claims struct {
			ID   string `json:"sub"`
			Name string `json:"name"`
		}
		if err := idToken.Claims(&claims); err != nil {
			logger.Logs("failed to exchange OAuth code", kvlog.WithErr(err))
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		// Create principal to store as part of the session.
		p := Principal(claims)
		ses.Set(PrincipalSessionKey, &p)

		redirectTarget := session.Get[string](ses, redirectTargetSessionKey)
		if redirectTarget == "" {
			redirectTarget = "/"
		}

		http.Redirect(w, r, redirectTarget, http.StatusTemporaryRedirect)
	})

	mux.HandleFunc("GET /info", func(w http.ResponseWriter, r *http.Request) {
		type AuthInfoDTO struct {
			LoggedIn bool   `json:"active"`
			Username string `json:"username,omitempty"`
		}

		p := FromRequest(r)

		dto := AuthInfoDTO{}
		if p != nil {
			dto.LoggedIn = true
			dto.Username = p.Name
		}

		response.JSON(w, r, dto)
	})

	mux.HandleFunc("GET /info.js", func(w http.ResponseWriter, r *http.Request) {
		var js string

		if p := FromRequest(r); p != nil {
			js = fmt.Sprintf("window._activeLogin = { name: %q};", p.Name)
		} else {
			js = "window._activeLogin = false;"
		}

		response.PlainText(w, r,
			js,
			response.AddHeader("Content-Type", "application/javascript"),
		)
	})

	mux.HandleFunc("GET /logout", func(w http.ResponseWriter, r *http.Request) {
		ses := session.FromContext(r.Context())
		ses.Delete(PrincipalSessionKey)

		http.Redirect(w, r, "/", http.StatusFound)
	})

	return mux, err
}

// generateStateToken returns a URL-safe, cryptographically secure random token.
func generateStateToken(n int) string {
	// n = number of random bytes (not characters).
	// 32 bytes → 43-char base64url string.
	b := make([]byte, n)

	if _, err := rand.Read(b); err != nil {
		panic(fmt.Sprintf("failed to generate random state: %v", err))
	}

	// Use RawURLEncoding to avoid padding (=) characters.
	return base64.RawURLEncoding.EncodeToString(b)
}
