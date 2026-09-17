//go:build integration

// Example integration test for an "items" feature. It drives the real router — middleware,
// handler, service, sqlc queries — against a real PostgreSQL Testcontainer.
//
// Copy to internal/<feature>/<feature>_integration_test.go and adapt:
//   - the example.com/app module path
//   - web.NewHandler and config.Config to the project's actual signatures (wire it the way
//     internal/app/app.go does, and set the config fields the auth strategy needs)
//   - signIn to the project's auth strategy (see the ## Web Middleware section of CLAUDE.md)
//   - table names, query names, and form fields to the feature under test
package items_test

import (
	"context"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	"example.com/app/internal/config"
	"example.com/app/internal/db"
	"example.com/app/internal/testdb"
	"example.com/app/internal/web"
)

var pool *pgxpool.Pool

func TestMain(m *testing.M) {
	p, stop := testdb.Start()
	defer stop()
	pool = p
	m.Run()
}

// newClient starts the real router and returns a signed-in client with a cookie jar.
func newClient(t *testing.T) (*httptest.Server, *http.Client) {
	t.Helper()
	cfg := config.Config{Env: "test"}
	srv := httptest.NewServer(web.NewHandler(web.Deps{Config: cfg, Pool: pool}))
	t.Cleanup(srv.Close)

	jar, _ := cookiejar.New(nil)
	client := &http.Client{
		Jar: jar,
		CheckRedirect: func(*http.Request, []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
	signIn(t, srv, client)
	return srv, client
}

func signIn(t *testing.T, srv *httptest.Server, client *http.Client) {
	t.Helper()
	testdb.Truncate(t, pool, "users")
	// Adapt: create the user the way the project stores credentials, then log in through
	// the real login route so the session cookie lands in the jar.
	createTestUser(t, "items-it@example.com", "correct-horse-battery")
	resp, err := client.PostForm(srv.URL+"/login", url.Values{
		"email":    {"items-it@example.com"},
		"password": {"correct-horse-battery"},
	})
	if err != nil {
		t.Fatalf("sign in: %v", err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusSeeOther {
		t.Fatalf("sign in: status %d, want 303", resp.StatusCode)
	}
}

func createTestUser(t *testing.T, email, password string) {
	t.Helper()
	// Adapt to the project's sqlc user query and password hashing.
	// Fails loudly until adapted — a template must never skip silently.
	t.Fatal("adapt createTestUser to the project's user table before using this template")
}

func get(t *testing.T, client *http.Client, u string) (int, string) {
	t.Helper()
	resp, err := client.Get(u)
	if err != nil {
		t.Fatalf("GET %s: %v", u, err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return resp.StatusCode, string(body)
}

func TestListItems(t *testing.T) {
	srv, client := newClient(t)
	testdb.Truncate(t, pool, "items")
	q := db.New(pool)
	ctx := context.Background()

	t.Run("returns every stored item", func(t *testing.T) {
		for _, name := range []string{"Item 1", "Item 2"} {
			if _, err := q.CreateItem(ctx, db.CreateItemParams{Name: name, Description: "seeded"}); err != nil {
				t.Fatalf("seed %s: %v", name, err)
			}
		}
		status, body := get(t, client, srv.URL+"/items")
		if status != http.StatusOK {
			t.Fatalf("status %d, want 200", status)
		}
		for _, want := range []string{"Item 1", "Item 2"} {
			if !strings.Contains(body, want) {
				t.Errorf("body does not contain %q", want)
			}
		}
	})

	t.Run("shows the empty state when no items exist", func(t *testing.T) {
		if _, err := pool.Exec(ctx, "DELETE FROM items"); err != nil {
			t.Fatal(err)
		}
		status, body := get(t, client, srv.URL+"/items")
		if status != http.StatusOK {
			t.Fatalf("status %d, want 200", status)
		}
		if !strings.Contains(body, "No items found") {
			t.Error("empty state message not rendered")
		}
	})
}

func TestCreateItem(t *testing.T) {
	srv, client := newClient(t)
	testdb.Truncate(t, pool, "items")
	q := db.New(pool)

	t.Run("persists a valid item and redirects", func(t *testing.T) {
		resp, err := client.PostForm(srv.URL+"/items", url.Values{
			"name":        {"New Item"},
			"description": {"A new item"},
		})
		if err != nil {
			t.Fatal(err)
		}
		resp.Body.Close()
		if resp.StatusCode != http.StatusSeeOther {
			t.Fatalf("status %d, want 303", resp.StatusCode)
		}

		items, err := q.ListItems(context.Background())
		if err != nil {
			t.Fatal(err)
		}
		if len(items) != 1 || items[0].Name != "New Item" {
			t.Fatalf("stored items = %+v, want one item named %q", items, "New Item")
		}
	})

	t.Run("rejects a missing name with 422 and stores nothing", func(t *testing.T) {
		before, _ := q.ListItems(context.Background())

		req, _ := http.NewRequest(http.MethodPost, srv.URL+"/items",
			strings.NewReader(url.Values{"description": {"Missing name"}}.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		req.Header.Set("HX-Request", "true")
		resp, err := client.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)

		if resp.StatusCode != http.StatusUnprocessableEntity {
			t.Fatalf("status %d, want 422", resp.StatusCode)
		}
		if !strings.Contains(string(body), "Name is required") {
			t.Error("field error not rendered in the fragment")
		}
		after, _ := q.ListItems(context.Background())
		if len(after) != len(before) {
			t.Errorf("item count changed from %d to %d on invalid input", len(before), len(after))
		}
	})
}
