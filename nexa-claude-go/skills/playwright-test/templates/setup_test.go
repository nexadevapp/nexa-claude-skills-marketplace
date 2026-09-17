//go:build e2e

// Package e2e drives the application in a real Chromium browser (Playwright for Go) against
// the real HTTP handler and a PostgreSQL Testcontainer, all inside one go test process.
//
// Copy to e2e/setup_test.go and adapt:
//   - the example.com/app module path
//   - config.Config to the fields the auth strategy needs
//   - createUser to the users table and the password hashing the login verifies
//
// Run: go test -tags=e2e ./e2e/...
package e2e

import (
	"context"
	"crypto/rand"
	"fmt"
	"log"
	"maps"
	"net/http/httptest"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mxschmitt/playwright-go"
	"golang.org/x/crypto/bcrypt"

	"example.com/app/internal/config"
	"example.com/app/internal/testdb"
	"example.com/app/internal/web"
)

var (
	baseURL string
	pool    *pgxpool.Pool
	browser playwright.Browser
	expect  = playwright.NewPlaywrightAssertions()
)

func TestMain(m *testing.M) {
	os.Exit(run(m))
}

// run starts the database, the server, and the browser, and stops them in reverse order after
// the tests — os.Exit in TestMain would skip these defers.
func run(m *testing.M) int {
	p, stop := testdb.Start()
	defer stop()
	pool = p

	srv := httptest.NewServer(web.NewHandler(web.Deps{Config: config.Config{Env: "test"}, Pool: pool}))
	defer srv.Close()
	baseURL = srv.URL

	pw, err := playwright.Run()
	if err != nil {
		log.Printf("e2e: start playwright (run `go tool playwright install --with-deps chromium`): %v", err)
		return 1
	}
	defer func() { _ = pw.Stop() }()

	browser, err = pw.Chromium.Launch()
	if err != nil {
		log.Printf("e2e: launch chromium: %v", err)
		return 1
	}
	defer func() { _ = browser.Close() }()

	return m.Run()
}

// newPage opens a page in a fresh browser context — its own cookies and storage, so no session
// leaks between tests — and closes it when the test ends. A failed test leaves a Playwright
// trace in e2e/test-results/.
func newPage(t *testing.T) playwright.Page {
	t.Helper()
	bctx, err := browser.NewContext(playwright.BrowserNewContextOptions{BaseURL: playwright.String(baseURL)})
	if err != nil {
		t.Fatalf("e2e: new browser context: %v", err)
	}
	err = bctx.Tracing().Start(playwright.TracingStartOptions{
		Screenshots: playwright.Bool(true),
		Snapshots:   playwright.Bool(true),
	})
	if err != nil {
		t.Fatalf("e2e: start trace: %v", err)
	}
	t.Cleanup(func() {
		var trace []string
		if t.Failed() {
			path, _ := filepath.Abs(filepath.Join("test-results", strings.ReplaceAll(t.Name(), "/", "_")+".zip"))
			_ = os.MkdirAll(filepath.Dir(path), 0o755)
			trace = append(trace, path)
			t.Logf("trace: go tool playwright show-trace %s", path)
		}
		if err := bctx.Tracing().Stop(trace...); err != nil {
			t.Errorf("e2e: stop trace: %v", err)
		}
		if err := bctx.Close(); err != nil {
			t.Errorf("e2e: close browser context: %v", err)
		}
	})

	page, err := bctx.NewPage()
	if err != nil {
		t.Fatalf("e2e: new page: %v", err)
	}
	return page
}

// must fails the test on a Playwright error. Every action and every web-first assertion
// (expect.Locator(...).ToBeVisible(), ...) returns one.
func must(t *testing.T, err error) {
	t.Helper()
	if err != nil {
		t.Fatal(err)
	}
}

type testUser struct {
	ID       string
	Email    string
	Password string
}

// createUser inserts a user with a random example.com email and a known password, and deletes
// it when the test ends — every record the user owns goes with it through ON DELETE CASCADE.
// columns sets additional users columns for the scenario, e.g. {"status": "SUSPENDED"}.
func createUser(t *testing.T, columns map[string]any) testUser {
	t.Helper()
	u := testUser{
		Email:    "e2e-" + strings.ToLower(rand.Text()[:8]) + "@example.com",
		Password: rand.Text(),
	}
	// Adapt: hash the password the way the login handler verifies it.
	hash, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.MinCost)
	if err != nil {
		t.Fatal(err)
	}

	// Adapt: the users table and its required columns.
	cols := map[string]any{"email": u.Email, "password_hash": string(hash)}
	maps.Copy(cols, columns)
	names := slices.Sorted(maps.Keys(cols))
	idents := make([]string, len(names))
	params := make([]string, len(names))
	args := make([]any, len(names))
	for i, name := range names {
		idents[i] = pgx.Identifier{name}.Sanitize()
		params[i] = fmt.Sprintf("$%d", i+1)
		args[i] = cols[name]
	}
	insert := fmt.Sprintf("INSERT INTO users (%s) VALUES (%s) RETURNING id::text",
		strings.Join(idents, ", "), strings.Join(params, ", "))
	if err := pool.QueryRow(context.Background(), insert, args...).Scan(&u.ID); err != nil {
		t.Fatalf("e2e: create user: %v", err)
	}

	t.Cleanup(func() {
		if _, err := pool.Exec(context.Background(), "DELETE FROM users WHERE id::text = $1", u.ID); err != nil {
			t.Errorf("e2e: delete user %s: %v", u.Email, err)
		}
	})
	return u
}
