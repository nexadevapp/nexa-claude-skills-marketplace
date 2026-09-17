// cmd/dev/main.go — local and E2E entry point.
//
// Starts PostgreSQL in a Testcontainer, applies the embedded goose migrations, loads
// db/seed.sql when it exists, and runs the app against that database.
// Ryuk removes the container if the process is killed before the deferred terminate runs.
//
// Replace example.com/app with the module path from go.mod.
package main

import (
	"context"
	"database/sql"
	"errors"
	"io/fs"
	"log"
	"os"
	"os/signal"
	"syscall"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"

	"example.com/app/db/migrations"
	"example.com/app/internal/app"
	"example.com/app/internal/config"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if err := run(ctx); err != nil {
		log.Fatal(err)
	}
}

func run(ctx context.Context) error {
	ctr, err := postgres.Run(ctx, "postgres:16-alpine",
		postgres.WithDatabase("app"),
		postgres.WithUsername("app"),
		postgres.WithPassword("app"),
		postgres.BasicWaitStrategies(),
	)
	if err != nil {
		return err
	}
	defer func() { _ = testcontainers.TerminateContainer(ctr) }()

	dsn, err := ctr.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		return err
	}
	if err := migrations.Up(ctx, dsn); err != nil {
		return err
	}
	if err := seed(ctx, dsn); err != nil {
		return err
	}

	cfg := config.FromEnv()
	cfg.DatabaseURL = dsn
	return app.Run(ctx, cfg)
}

// seed runs db/seed.sql (baseline reference data) when the file exists.
func seed(ctx context.Context, dsn string) error {
	script, err := os.ReadFile("db/seed.sql")
	if errors.Is(err, fs.ErrNotExist) {
		return nil
	}
	if err != nil {
		return err
	}

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return err
	}
	defer db.Close()

	// No arguments, so pgx uses the simple protocol and accepts multiple statements.
	_, err = db.ExecContext(ctx, string(script))
	return err
}
