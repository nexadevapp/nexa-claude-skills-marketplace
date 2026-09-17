# Project Readiness Gate

## Instructions

Before implementing any use case (`UC-XXX`), validate that the project's cross-cutting
infrastructure is in place. Check every item below. If any item fails, report all failures
to the user and **stop** — do not begin implementation.

This gate ensures that error logging, authentication, authorization, security headers, and
environment configuration exist before feature code is written. Without these, use case
implementations will lack consistent error handling, auth checks, and security protections.

**This gate does NOT apply to:**
- Technical tasks (`TT-XXX`) — these may be the tasks that set up the infrastructure itself
- Bug fixes (`BUG-XXX`) — these fix existing code and should not be blocked

## How to Check

Read `go.mod` for the Go version and the module path. `http.CrossOriginProtection` needs
Go 1.25 or later. Use the context7 MCP server when an API or file convention of templ, sqlc,
goose, or the chosen session library is unclear for the installed version.

## Checklist

### Application Entry Points

- [ ] **Server entry point** — `cmd/server/main.go` exists and calls `app.Run`
- [ ] **Dev entry point** — `cmd/dev/main.go` exists and starts PostgreSQL through Testcontainers
- [ ] **Router** — `internal/web/routes.go` registers every route on one `http.ServeMux`
- [ ] **Shared layout** — `internal/web/layout.templ` exists and htmx is embedded from `internal/web/static/`

### Request Interception Layer (auth, routing, security headers)

- [ ] **Auth helpers** — `internal/auth/` has `FromContext`, `(*Session).HasRole`, `RequireAuth`, `GuestOnly`, and `RequireRole`
- [ ] **Public paths** — `auth.PublicPaths` lists the paths that need no session; every other path requires one
- [ ] **Middleware chain** — `web.NewHandler` in `internal/web/routes.go` wraps the mux with `auth.RequireAuth`
- [ ] **Security headers** — a security headers middleware exists and is in the chain
- [ ] **CSRF protection** — `http.CrossOriginProtection` is in the chain

### Error Handling & Observability

- [ ] **Structured logger** — `slog` is configured with a JSON handler in `internal/app`
- [ ] **Panic recovery** — a recover middleware in `internal/web/` logs the panic through `slog` and returns 500
- [ ] **Request log** — `LogRequests` in `internal/web/` is the outermost middleware

### Environment Configuration

- [ ] **Local profile** — `.env` exists and is ignored by git
- [ ] **Auth secrets configured** — every secret the chosen auth strategy reads (e.g. `SESSION_SECRET` for signed-cookie sessions; none for scs) is defined in `.env` and checked by `Config.Validate`
- [ ] **Config loader** — `internal/config/config.go` has `FromEnv` and `Config.Validate`, and `app.Run` calls `Validate`

### Database

- [ ] **Migrations** — `db/migrations/` contains at least one goose migration and `db/migrations/embed.go` exposes `Up`
- [ ] **sqlc** — `sqlc.yaml` exists and the generated package `internal/db/` exists
- [ ] **No generate drift** — `go tool templ generate && sqlc generate` leaves `git status --porcelain` unchanged

### Build

- [ ] **Compiles** — `go build ./... && go vet ./...` succeeds

### Internationalization (Conditional)

**Detection:** Check the project's `CLAUDE.md` for the marker `<!-- NEXA_I18N_CONFIGURED -->`.
If the marker is absent, scan `docs/requirements.md` for mentions of internationalization,
localization, multi-language, i18n, or supported locales.

If neither the marker nor the requirements mention i18n, skip this section entirely.

If the requirements mention i18n and the marker is absent, report it as a failure. The Go
plugin has no `/setup-i18n` skill yet, so the user must either set up i18n by hand (then add
the marker to `CLAUDE.md`) or explicitly waive this item.

**Why this is checked early:** Adding i18n after features are built requires retrofitting
every templ view and every user-facing message. Deciding before implementation avoids a costly
migration later.

## On Failure

Report which checks failed and guide the user to the correct skill:

| Missing Infrastructure                        | Run This First          |
|-----------------------------------------------|-------------------------|
| Auth / route rules / headers / CSRF / recover | `/setup-web-middleware` |
| Environment files / config / `cmd/dev`        | `/setup-env-profiles`   |
| Migrations or sqlc                            | `/db-migration`         |
| Internationalization                          | set up by hand, or waive |

Example failure message:

```
PROJECT READINESS FAILED — cannot implement UC-XXX

Missing infrastructure:
- ✗ No auth middleware in internal/web/routes.go
- ✗ No panic recovery middleware
- ✗ No .env file found
- ✗ db/migrations/ is empty

Run these skills first:
1. /setup-env-profiles — creates environment files, the config loader, and cmd/dev
2. /db-migration — creates the goose migrations and sqlc queries
3. /setup-web-middleware — sets up auth, security headers, CSRF, recovery, and structured logging

After running these, re-run /implement UC-XXX.
```
