---
name: integration-test
description: >
  Creates Go integration tests for net/http handlers, services, and sqlc queries against a real
  PostgreSQL database started with testcontainers-go. Use when the user asks to "write
  integration tests", "test with a real database", "create Go integration tests", or mentions
  Go integration testing, testcontainers-go, or database-backed tests. Unit tests are created by
  the implement skill.
---

# Integration Test

## Instructions

Create Go integration tests for the handlers, services, and queries of the use case $ARGUMENTS.
Unit tests are already created by the `/implement` skill — this skill focuses on integration
tests that hit a real PostgreSQL database via testcontainers-go.

Use the context7 MCP server for testcontainers-go, pgx, and sqlc documentation when needed.

## DO NOT

- Test implementation details (test behavior, not internals)
- Skip error case testing
- Fake or mock `db.Querier` — integration tests use a real database via Testcontainers
- Hard-code database connection strings — the DSN comes from the container started by `internal/testdb`
- Start a container per test — one container per test package, started in `TestMain`
- Omit the `//go:build integration` tag — without it `go test ./...` and mutation testing would boot containers
- Use `t.Skip` to dodge a failing or Docker-dependent test — if Docker is not running, stop and tell the user

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Worktree Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/WORKTREE_GATE.md`.

## Test Data Conventions

- Use only `example.com` for test emails and accounts (e.g., `user@example.com`, `admin@example.com`). This is an IANA-reserved domain that will never route real mail.

## Testcontainers Setup

Before writing tests, ensure the project has the shared helper that starts a PostgreSQL
Testcontainer, applies the goose migrations, and returns a `*pgxpool.Pool`.

If `internal/testdb/testdb.go` does not exist, create it from [templates/testdb.go](templates/testdb.go)
and replace the `example.com/app` module path with the one in `go.mod`. It depends on
`db/migrations.Up(ctx, dsn)` (created by `/db-migration`). It compiles under the `integration`
and the `e2e` build tags, so `/playwright-test` shares it.

Add the dependencies if `go.mod` lacks them:

```bash
go get github.com/testcontainers/testcontainers-go github.com/testcontainers/testcontainers-go/modules/postgres
```

Each test package starts the container once:

```go
//go:build integration

package items_test

var pool *pgxpool.Pool

func TestMain(m *testing.M) {
	p, stop := testdb.Start()
	defer stop()
	pool = p
	m.Run()
}
```

## Test Data Strategy

| Approach        | Location                        | Purpose              |
|-----------------|---------------------------------|----------------------|
| Seed SQL        | `db/seed.sql`, run by `testdb.Start` | Baseline reference data |
| sqlc queries    | `db.New(pool)` in test setup    | Test-specific data   |
| Cleanup         | `testdb.Truncate(t, pool, ...)` | Empty the tables the test wrote to, via `t.Cleanup` |

## Templates

- Container helper: [templates/testdb.go](templates/testdb.go)
- Test example: [templates/example_integration_test.go](templates/example_integration_test.go)

## Common Patterns

### Handler Tests Through the Real Router

Start the real handler with `httptest.NewServer(web.NewHandler(...))`, wired the way `internal/app/app.go` wires it, so
middleware, handler, service, and queries all run. Use a client with a cookie jar and
`CheckRedirect` returning `http.ErrUseLastResponse` so redirects are asserted, not followed.

```go
func TestCreateItem(t *testing.T) {
	srv, client := newClient(t) // httptest.NewServer(web.NewHandler(web.Deps{Config: cfg, Pool: pool})) + signed-in client
	testdb.Truncate(t, pool, "items")

	resp, err := client.PostForm(srv.URL+"/items", url.Values{"name": {"New Item"}})
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusSeeOther {
		t.Fatalf("status %d, want 303", resp.StatusCode)
	}

	// Verify it was persisted
	items, err := db.New(pool).ListItems(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if len(items) != 1 || items[0].Name != "New Item" {
		t.Fatalf("stored items = %+v", items)
	}
}
```

### htmx Fragment Requests

Set `HX-Request: true` and assert both the status and that the body is the fragment, not the
full layout:

```go
req.Header.Set("HX-Request", "true")
// ...
if resp.StatusCode != http.StatusUnprocessableEntity {
	t.Fatalf("status %d, want 422", resp.StatusCode)
}
if strings.Contains(body, "<html") {
	t.Error("htmx request received the full page")
}
```

### Service and Query Tests

Where a business rule depends on database behaviour (unique constraints, cascades, transactions,
ordering), test the service directly against the real pool:

```go
func TestRegisterRejectsDuplicateEmail(t *testing.T) {
	testdb.Truncate(t, pool, "users")
	svc := users.NewService(db.New(pool))

	if _, err := svc.Register(ctx, "dup@example.com"); err != nil {
		t.Fatal(err)
	}
	if _, err := svc.Register(ctx, "dup@example.com"); !errors.Is(err, users.ErrEmailTaken) {
		t.Fatalf("err = %v, want ErrEmailTaken", err)
	}
}
```

## Assertions Reference

| Assertion Type | Example |
|----------------|---------|
| Equality       | `if got != want { t.Errorf("got %q, want %q", got, want) }` |
| Error kind     | `if !errors.Is(err, users.ErrNotFound) { t.Fatalf(...) }` |
| No error       | `if err != nil { t.Fatal(err) }` |
| Slice length   | `if len(items) != 2 { t.Fatalf("len = %d, want 2", len(items)) }` |
| HTTP status    | `if resp.StatusCode != http.StatusOK { t.Fatalf(...) }` |
| Redirect       | `if loc := resp.Header.Get("Location"); loc != "/items" { t.Errorf(...) }` |
| Body contains  | `if !strings.Contains(body, "Item created") { t.Error(...) }` |
| Deep equality  | `reflect.DeepEqual(got, want)` (or `cmp.Diff` if go-cmp is already in `go.mod`) |

## Workflow

1. Read the use case specification
2. Use TodoWrite to create a task for each test scenario
3. Ensure `internal/testdb/testdb.go` exists; create from template if missing
4. Ensure `db/migrations/embed.go` exposes `Up(ctx, dsn)`; if missing, stop and run `/db-migration` first
5. Create `internal/<feature>/<feature>_integration_test.go` with the `//go:build integration` tag and a `TestMain` calling `testdb.Start()`
6. For each test:
    - Set up test data with sqlc queries on the real pool
    - Build the input (`url.Values`, `http.Request`, or service arguments)
    - Execute the operation under test
    - Assert expected outcomes, including database persistence where applicable
    - Register cleanup with `testdb.Truncate(t, pool, <tables written>)`
7. Never fake the database — the only substitutes allowed are for external services outside the process (mail, payment), and only through the project's existing seam
8. Run the `/code-quality` skill
9. Run tests with `go test -tags=integration ./...` to verify they pass
10. Run tests with coverage to verify the threshold:
    ```bash
    go test -tags=integration -coverpkg=./internal/... -coverprofile=coverage.out ./...
    grep -v -e '/internal/db/' -e '/internal/testdb/' -e '_templ.go' coverage.out > coverage.filtered.out
    go tool cover -func=coverage.filtered.out
    ```
    - The `total:` line must be at least 80%
    - If it falls below, add tests until it is met — focus on uncovered branches and functions first (`go tool cover -html=coverage.filtered.out` shows them), since they have the highest impact
11. If a test fails:
    - Check that Docker is running (`docker info`) — Testcontainers requires it
    - Verify the migrations apply cleanly (`testdb.Start` logs the goose error)
    - Check that cleanup from one test is not removing rows another subtest still needs
    - Run the single package with `-v` to read the full output
12. Mark todos complete

## Resources

- Use the context7 MCP server for testcontainers-go, pgx, and sqlc documentation
