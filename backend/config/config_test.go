package config

import (
	"testing"

	"github.com/halimath/expect"
	"github.com/halimath/expect/is"
)

func TestNew(t *testing.T) {
	t.Setenv("PROVIDER_URL", "providerURL")
	t.Setenv("CLIENT_ID", "clientID")
	t.Setenv("CLIENT_SECRET", "clientSecret")
	t.Setenv("HTTP_PORT", "9090")
	t.Setenv("GRID_DB_PATH", "some/path")

	cfg, err := New()

	expect.That(t,
		is.NoError(err),
		is.DeepEqualTo(cfg, Config{
			HTTPPort:   9090,
			GridDBPath: "some/path",
			OAuth: OAuthConfig{
				ProviderURL:  "providerURL",
				ClientID:     "clientID",
				ClientSecret: "clientSecret",
			},
		}),
	)
}
