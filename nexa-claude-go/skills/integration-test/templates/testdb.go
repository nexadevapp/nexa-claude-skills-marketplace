//go:build integration || e2e

// Package testdb starts one PostgreSQL Testcontainer per test binary, applies the goose
// migrations and db/seed.sql, and hands out a pgx pool. Integration tests (tag integration)
// and browser tests (tag e2e) share it. Copy to internal/testdb/testdb.go and replace the
// example.com/app module path with the project's module path.
package testdb

import (
	"context"
	"errors"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"

	"example.com/app/db/migrations"
)

// Start boots the container, runs migrations and the seed, and returns the pool and a stop
// function. Call it once from each package's TestMain:
//
//	var pool *pgxpool.Pool
//
//	func TestMain(m *testing.M) {
//		p, stop := testdb.Start()
//		defer stop()
//		pool = p
//		m.Run()
//	}
func Start() (*pgxpool.Pool, func()) {
	ctx := context.Background()

	ctr, err := postgres.Run(ctx, "postgres:16-alpine",
		postgres.WithDatabase("testdb"),
		postgres.WithUsername("test"),
		postgres.WithPassword("test"),
		postgres.BasicWaitStrategies(),
	)
	if err != nil {
		log.Fatalf("testdb: start postgres (is Docker running?): %v", err)
	}

	dsn, err := ctr.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		log.Fatalf("testdb: connection string: %v", err)
	}
	if err := migrations.Up(ctx, dsn); err != nil {
		log.Fatalf("testdb: migrate: %v", err)
	}

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		log.Fatalf("testdb: pool: %v", err)
	}
	if err := seed(ctx, pool); err != nil {
		log.Fatalf("testdb: seed: %v", err)
	}

	return pool, func() {
		pool.Close()
		_ = testcontainers.TerminateContainer(ctr)
	}
}

// Truncate empties the given tables when the test finishes, so each test removes only the
// rows its own tables received. Reference data from db/seed.sql lives in tables you do not list.
func Truncate(t *testing.T, pool *pgxpool.Pool, tables ...string) {
	t.Helper()
	t.Cleanup(func() {
		names := make([]string, len(tables))
		for i, table := range tables {
			names[i] = pgx.Identifier{table}.Sanitize()
		}
		sql := "TRUNCATE " + strings.Join(names, ", ") + " RESTART IDENTITY CASCADE"
		if _, err := pool.Exec(context.Background(), sql); err != nil {
			t.Errorf("testdb: truncate %v: %v", tables, err)
		}
	})
}

// seed runs db/seed.sql (baseline reference data) when the file exists. go test runs in the
// package directory, so the file is found relative to the module root (the go.mod directory).
func seed(ctx context.Context, pool *pgxpool.Pool) error {
	root, err := moduleRoot()
	if err != nil {
		return err
	}
	script, err := os.ReadFile(filepath.Join(root, "db", "seed.sql"))
	if errors.Is(err, fs.ErrNotExist) {
		return nil
	}
	if err != nil {
		return err
	}
	// No arguments, so pgx uses the simple protocol and accepts multiple statements.
	_, err = pool.Exec(ctx, string(script))
	return err
}

func moduleRoot() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for {
		if _, err := os.Stat(filepath.Join(dir, "go.mod")); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", errors.New("go.mod not found above the working directory")
		}
		dir = parent
	}
}
