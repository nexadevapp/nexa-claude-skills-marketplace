---
name: setup-env-profiles
description: >
  Sets up environment profiles (local, dev) for a Go project with database connection strings
  and environment-specific configuration, and scaffolds the config loader and the `cmd/dev`
  entry point. Local uses Testcontainers, dev uses Supabase. Only prompts the user for the
  Supabase connection strings. Use when the user asks to "set up environments", "configure
  profiles", "create .env files", "set up local/dev", or mentions environment profiles,
  environment configuration, or database connection setup.
---

# Setup Environment Profiles

## Instructions

Set up two environment profiles — **local** and **dev** — and scaffold the Go code that reads
them. Local uses Testcontainers; dev uses Supabase. Tests need no profile: integration and E2E
tests start their own container and build `config.Config` in code.

The application reads configuration only from process environment variables (`os.Getenv`).
The env files are sourced by the shell, never parsed by the application:

```bash
set -a; . ./.env; set +a
```

This skill is **minimally interactive**. The only user input required is the Supabase
connection strings for the dev profile.

## DO NOT

- Generate `docker-compose.yml` or any Docker infrastructure files
- Add a dotenv library (e.g. `godotenv`) — the shell sources the files
- Overwrite an existing env file without showing the user what will change and asking for confirmation
- Store real credentials in committed files (`.env` and `.env.*` must be in `.gitignore`)
- Invent or guess database credentials — always ask the user
- Overwrite an existing `internal/config/config.go`, `internal/app/app.go`, `cmd/server/main.go`, or `cmd/dev/main.go` without showing the diff and asking
- Add a secret the chosen auth strategy does not use — `/setup-web-middleware` adds `SESSION_SECRET` only for signed-cookie sessions

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Prerequisites

- `go.mod` exists. Read its `module` path — every import below uses it in place of
  `example.com/app`.
- `.gitignore` ignores the env files. If not, add these lines before creating any env file:

```
.env
.env.*
!.env.example
```

## Profiles and File Mapping

| Profile | File       | `APP_ENV` | Database                              | Purpose                      |
|---------|------------|-----------|---------------------------------------|------------------------------|
| local   | `.env`     | `local`   | Testcontainers (started by `cmd/dev`) | Local machine development    |
| dev     | `.env.dev` | `dev`     | Supabase                              | Shared development / staging |

Production reads the same variables from the deploy environment, with `APP_ENV=production`.

## Workflow

### Step 0: Consult Documentation

Use the context7 MCP server before writing anything. Query:

- **testcontainers-go** — the `modules/postgres` `Run` options, wait strategy, and
  `ConnectionString` for the installed version
- **pgx v5** — connection string parameters for a PgBouncer-style transaction pooler
  (`default_query_exec_mode`)
- **goose** — the Provider API (`goose.NewProvider`) used by `migrations.Up`, and the
  `GOOSE_DRIVER` / `GOOSE_DBSTRING` / `GOOSE_MIGRATION_DIR` environment variables of the CLI

Use the findings in the steps below. Do not keep an option name you did not verify.

### Step 1: Detect Existing Configuration

1. Check for `internal/config/config.go`, `internal/app/app.go`, `cmd/server/main.go`,
   `cmd/dev/main.go`, and `db/migrations/embed.go`
2. Check whether `.env` or `.env.dev` already exist
3. If existing files are found, show the user which ones exist and ask whether to update them
   or skip

### Step 2: Local Profile (`.env`) — Auto-generated

Not interactive. `DATABASE_URL` is injected by `cmd/dev` at startup.

```env
# =============================================================================
# Local Environment Profile (Testcontainers)
# =============================================================================
# DATABASE_URL is set by `go run ./cmd/dev`: it starts a PostgreSQL container,
# applies the migrations, and uses that connection string.

APP_ENV="local"
PORT="8080"
BASE_URL="http://localhost:8080"
```

Add any other variables the project needs with safe local-only defaults.

### Step 3: Dev Profile (`.env.dev`) — Supabase

Ask the user for both URLs:

> **Supabase connection strings for the dev environment:**
>
> 1. **Pooled URL** (`DATABASE_URL`) — used by the application at runtime (transaction pooler).
>    Typically:
>    `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
>
> 2. **Direct URL** (`GOOSE_DBSTRING`) — used by goose for migrations (session mode / direct).
>    Typically:
>    `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`
>
> Find both in the Supabase dashboard under **Settings → Database → Connection string**.

Wait for the user to provide both connection strings.

**pgx and the transaction pooler.** The transaction pooler (port 6543) does not keep prepared
statements across transactions, and pgx caches prepared statements by default. Add the query
parameter the Step 0 docs name for this — `default_query_exec_mode=exec` per the pgx PgBouncer
guidance (`simple_protocol` also works) — to the pooled `DATABASE_URL` (with `?`, or `&` if the
URL already has a query string). Without it the app fails intermittently with
`prepared statement "stmtcache_..." already exists`. `GOOSE_DBSTRING` does not need it.

```env
# =============================================================================
# Dev Environment Profile (Supabase)
# =============================================================================

APP_ENV="dev"
PORT="8080"
# BASE_URL="<if applicable>"

# Database — pooled, used by the app (keep the pgx exec-mode parameter)
DATABASE_URL="<user_provided_pooled_url>?default_query_exec_mode=exec"

# goose CLI — direct connection for migrations (bypasses the pooler)
GOOSE_DRIVER="postgres"
GOOSE_DBSTRING="<user_provided_direct_url>"
GOOSE_MIGRATION_DIR="db/migrations"
```

### Step 4: Additional Environment Variables

Scan the codebase for `os.Getenv("...")` calls and `internal/config` fields. For each variable
not yet covered:

- **local** — add a safe default automatically
- **dev** — ask the user for the value; comment out optional variables that were not provided
  rather than omitting them

For any variable already present in an existing env file, show the current value and ask
whether to keep or update it. If `.env.example` exists, add the new names there without values.

### Step 5: Scaffold Config and Entry Points

Create each file below only if it does not exist.

**`internal/config/config.go`** — the single place environment variables are read:

```go
package config

import (
	"fmt"
	"os"
	"strings"
)

type Config struct {
	Env         string // local | dev | test | production
	Port        string
	BaseURL     string
	DatabaseURL string
}

// FromEnv reads the configuration from process environment variables.
func FromEnv() Config {
	return Config{
		Env:         getenv("APP_ENV", "local"),
		Port:        getenv("PORT", "8080"),
		BaseURL:     os.Getenv("BASE_URL"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
	}
}

// Validate reports every required setting that is missing.
func (c Config) Validate() error {
	var missing []string
	if c.DatabaseURL == "" {
		missing = append(missing, "DATABASE_URL")
	}
	if len(missing) > 0 {
		return fmt.Errorf("missing required environment variables: %s", strings.Join(missing, ", "))
	}
	return nil
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
```

**`internal/app/app.go`** — `Run(ctx, cfg)`: validate the config, configure `slog`, open the
pool, serve, and on cancellation shut down gracefully. The mux here is a placeholder with
`GET /healthz`; `/setup-web-middleware` replaces it with `web.NewHandler` from
`internal/web/routes.go`.

```go
package app

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"example.com/app/internal/config"
)

func Run(ctx context.Context, cfg config.Config) error {
	if err := cfg.Validate(); err != nil {
		return err
	}

	level := slog.LevelDebug
	if cfg.Env == "production" {
		level = slog.LevelInfo
	}
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level}))
	slog.SetDefault(logger)

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	srv := &http.Server{
		Addr:     ":" + cfg.Port,
		Handler:  mux,
		ErrorLog: slog.NewLogLogger(logger.Handler(), slog.LevelError),
	}

	serveErr := make(chan error, 1)
	go func() {
		logger.Info("listening", "addr", srv.Addr, "env", cfg.Env)
		serveErr <- srv.ListenAndServe()
	}()

	select {
	case err := <-serveErr:
		return err // the server failed to start
	case <-ctx.Done():
	}

	// Shutdown returns once in-flight requests finish, so the pool is closed only after them.
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return srv.Shutdown(shutdownCtx)
}
```

**`cmd/server/main.go`** — production entry: `signal.NotifyContext`, `config.FromEnv()`,
`app.Run`. No container, no migrations — production migrations run as a deploy step with
`go tool goose up` and the `GOOSE_*` variables set in the deploy environment.

**`cmd/dev/main.go`** — copy [templates/cmd-dev-main.go](templates/cmd-dev-main.go) and replace
`example.com/app` with the module path. Adjust the option names to what Step 0 confirmed.

`cmd/dev` imports `db/migrations`. If `db/migrations/embed.go` does not exist yet, write
`cmd/dev/main.go` anyway and tell the user it compiles once `/db-migration` creates the first
migration.

Add the dependencies:

```bash
go get github.com/jackc/pgx/v5 github.com/testcontainers/testcontainers-go/modules/postgres
go mod tidy
```

### Step 6: Update CLAUDE.md

Append a `## Environment Profiles` section to the target project's `CLAUDE.md`.

1. If `CLAUDE.md` does not exist, create it
2. If a `## Environment Profiles` section already exists (check for `<!-- NEXA_ENV_PROFILES_CONFIGURED -->`),
   ask the user whether to overwrite or skip
3. Append the following section (fill in the actual values from the setup):

~~~markdown
## Environment Profiles

<!-- NEXA_ENV_PROFILES_CONFIGURED -->

| Profile | File       | Database                              |
|---------|------------|---------------------------------------|
| local   | `.env`     | Testcontainers (started by `cmd/dev`) |
| dev     | `.env.dev` | Supabase                              |

- Config is read only from process env in `internal/config/config.go`; env files are sourced by the shell: `set -a; . ./.env; set +a`
- Run locally: `go run ./cmd/dev` (starts Postgres, applies migrations, loads `db/seed.sql` if present)
- Local `DATABASE_URL` is injected by `cmd/dev` — do not set it in `.env`
- Tests need no env file: integration and E2E tests start their own container
- Dev `DATABASE_URL` uses the Supabase transaction pooler with `default_query_exec_mode=exec` (pgx); `GOOSE_DBSTRING` is the direct connection for `go tool goose`
- `.env` and `.env.*` are in `.gitignore` (except `.env.example`)
~~~

Do not remove or modify any other content in `CLAUDE.md`.

## Verification

1. `go build ./...` succeeds (skip `cmd/dev` only if `db/migrations/embed.go` does not exist yet
   — say so)
2. `git check-ignore .env .env.dev` lists both

Then summarize:

```
## Environment Profiles Created

| Profile | File     | Database                            |
|---------|----------|-------------------------------------|
| local   | .env     | Testcontainers (started by cmd/dev) |
| dev     | .env.dev | Supabase                            |

### Scaffolded
- internal/config/config.go, internal/app/app.go, cmd/server/main.go, cmd/dev/main.go (created / already existed)

### Next Steps
- Run /db-migration to create the schema (cmd/dev needs db/migrations)
- Run locally: `set -a; . ./.env; set +a; go run ./cmd/dev`
- Migrate dev: `set -a; . ./.env.dev; set +a; go tool goose up`
```
