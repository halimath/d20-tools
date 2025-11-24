package config

import (
	"context"

	"github.com/sethvargo/go-envconfig"
)

type OAuthConfig struct {
	ProviderURL  string `env:"PROVIDER_URL, default=https://auth.wilanthaou.de/application/o/d20-tools/"`
	ClientID     string `env:"CLIENT_ID, default=w4MUlbBTvCPkXx5HeXSeGrj6ewN3Ng5pwNKYXU0D"`
	ClientSecret string `env:"CLIENT_SECRET"`
	RedirectURL  string `env:"REDIRECT_URL"`
}

type Config struct {
	HTTPPort int `env:"HTTP_PORT, default=8080"`

	GridDBPath string `env:"GRID_DB_PATH, default=grid.db"`

	DevMode bool `env:"DEV_MODE"`

	OAuth OAuthConfig
}

func New() (Config, error) {
	ctx := context.Background()
	var cfg Config
	err := envconfig.Process(ctx, &cfg)
	return cfg, err
}
