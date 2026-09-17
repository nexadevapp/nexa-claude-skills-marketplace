---
name: playwright-test
description: >
  Creates browser-based end-to-end tests for a Go web application (templ + htmx) with Playwright
  for Go, covering complete user journeys from start to finish. The tests are Go tests behind the
  `e2e` build tag and run with `go test`. Use when the user asks to "write Playwright tests",
  "create e2e tests", "test in the browser", or mentions end-to-end testing, browser tests, UI
  integration tests, or Playwright for a Go app.
---

# Playwright Test

## Instructions

Create end-to-end tests for the Go application's pages based on the use case $ARGUMENTS, with
Playwright for Go (`github.com/mxschmitt/playwright-go`). The tests are ordinary Go tests in
`e2e/`, behind the `//go:build e2e` tag. One `go test` process starts a PostgreSQL
Testcontainer (`internal/testdb`), serves the real handler (`web.NewHandler`) with
`httptest.NewServer`, and drives it with Chromium.

There is no Node project, no `package.json`, and no test-only HTTP endpoint: tests create their
data directly through the database pool, in process.

**End-to-end means end-to-end.** Each test walks the complete user journey from entry point to
final outcome — exactly as a real user would. Tests navigate by clicking links and buttons, not
by jumping to internal URLs. If a real user must click three screens to reach a form, the test
clicks through those same three screens.

## Inputs

| Input | Location | Required |
|-------|----------|----------|
| Use case specification | `docs/use_cases/UC-XXX.md` | Yes |
| Frontend design | `docs/designs/UC-XXX-design.html` | Yes |

The **use case specification** defines *what* the system does (scenarios, alternative flows, business
rules). The **frontend design** defines *how* it looks and behaves (screens, components, states,
user actions, navigation flow). Together they determine the test scenarios and assertions:

- **Test scenarios** derive from the use case Main Success Scenario and Alternative Flows
- **Page structure and selectors** derive from the frontend design's Components and Layout sections
- **Assertions** derive from the frontend design's States (default, loading, empty, error, success) and Data Displayed sections
- **User interactions** derive from the frontend design's User Actions (triggers, results)
- **Navigation expectations** derive from the frontend design's Navigation Flow and Screen Map

If `docs/designs/$ARGUMENTS-design.html` does not exist, stop and tell the user to run `/design-screens $ARGUMENTS` first.

## Test Philosophy: Journeys, Not Fragments

The purpose of E2E tests is to verify that the **complete user journey works end-to-end**. Each
test represents one path through the use case — either the Main Success Scenario or an
Alternative Flow.

**How many tests per use case:**
- **1 subtest** for the Main Success Scenario (the happy path, all steps start to finish)
- **1 subtest per Alternative Flow** that diverges meaningfully from the MSS
- Business rules are verified **inline** within the journey they belong to, not as separate tests

A typical use case produces **3–8 subtests total**, not dozens.

**What makes it E2E:**
- The test starts at the application's entry point (e.g., landing page, login screen)
- Every navigation happens through UI interactions (clicks, form submissions) — never `page.Goto()` to internal pages
- The test verifies intermediate states along the way, not just the final outcome
- The test verifies **Postconditions**:
    - For success flows: data is visible and correctly stored in the system.
    - For failure flows: the system state remains unchanged (e.g., no partial records created, original values preserved). When UI-only verification is insufficient, query the database through `pool` (or `db.New(pool)`) after the journey.
- The test ends with a verifiable outcome (data visible, confirmation shown, redirect happened)

**`page.Goto()` is only used ONCE per test** — to open the application entry point (e.g., `page.Goto("/")` or `page.Goto("/login")`). All subsequent navigation must happen through the UI.

**htmx swaps are navigation too.** A click that triggers an `hx-get`/`hx-post` swap replaces part
of the page without a full load. Wait for the swapped-in element (the new row, the error message,
the updated heading) — never for a page load event.

## Traceability Convention

Each use case is one top-level test function, `TestUC<NNN>`, and each scenario is a subtest
named `"<scenario>/<journey description>"`. The helpers in `e2e/trace_test.go` link a test to
its documents:

- **`useCase(t, "UC-NNN", scenario, refs...)`** — first line of every scenario subtest.
  `scenario` is `MSS`, `AF-N`, or `EX-N`; `refs` are the `CR-NNN` change requests the test
  verifies and the `BUG-NNN` bugs it guards against. Fails the test if a referenced document
  does not exist.
- **`bug(t, "BUG-NNN")`** — first line of a pure bug regression test, `TestBUG<NNN>`, that has no
  clean use case home.

```go
func TestUC007(t *testing.T) {
	volunteer := createUser(t, nil)

	t.Run("MSS/volunteer adds an entry via the modal", func(t *testing.T) {
		useCase(t, "UC-007", "MSS", "CR-002")
		page := newPage(t)
		// ... journey
	})

	t.Run("AF-1/ongoing checkbox disables end date", func(t *testing.T) {
		useCase(t, "UC-007", "AF-1", "CR-003", "BUG-004")
		page := newPage(t)
		// ... journey
	})
}
```

The names make every link selectable with `go test -run`: `-run 'TestUC007'`,
`-run 'TestUC007/AF-1'`, `-run 'TestBUG002'`. The helpers log a `[trace]` line that
`go test -json` output carries.

**Inline comments** — when a single line/assertion exists *because of* a CR, BUG, or business
rule, leave a one-line marker comment:

```go
// CR-003: month/year picker
must(t, page.Locator(`input[type="month"]`).First().Fill("2025-06"))

// Verifies BR-001: [Rule Name]
must(t, expect.Locator(page.GetByText("Error")).ToBeVisible())

// Verifies Success Postcondition: [Postcondition Name]
must(t, expect.Locator(page.Locator("table")).ToContainText([]string{"New Item"}))
```

## DO NOT

- **Navigate with `page.Goto()` to internal pages** — only use `page.Goto()` once per test to open the entry point. All other navigation must happen through clicking links, buttons, and submitting forms. This is the most important rule: if you bypass navigation, you are not testing E2E
- **Write one test per step or per screen** — each test must cover the full journey. A test that only checks "form displays correctly" is not an E2E test
- **Create separate tests for business rules** — verify business rules inline within the journey where they apply
- **Run tests on multiple browsers** — use Chromium only (`pw.Chromium`)
- **Add a test-only HTTP endpoint or a production JSON route** for test data — create it through `createUser` and the pool
- **Omit the `//go:build e2e` tag** — without it `go test ./...` and mutation testing would launch browsers
- **Wait for network idle** (`WaitForLoadState` with `networkidle`) — htmx polling (`hx-trigger="every ..."`), SSE, and background requests can delay or prevent it from settling, causing flaky timeouts in CI. Instead, wait for the specific UI element that signals the page or swap is ready (a heading, a table row, a form field)
- Skip waiting for page loads, htmx swaps, or network requests to complete
- Use hard-coded delays (`time.Sleep`, `page.WaitForTimeout`) instead of web-first assertions
- Delete all data in cleanup (only remove data created during the test)
- Hard-code database connection strings — `testdb.Start` provides the pool
- Write tests that contradict the frontend design (e.g., asserting a table when the design specifies cards)
- **Skip, exclude, or filter out tests** — never use `-run`, `-skip`, `t.Skip()`, or any other mechanism to avoid running tests in a verification run. All tests must run and pass
- **Claim tests pass without verifying output** — you must check the actual `go test` output for `ok` / `PASS` and exit code 0 before declaring success
- **Sleep or wait between test retries** — when tests fail, diagnose and fix the root cause immediately, then re-run. The fix-then-rerun cycle must be immediate
- **Ignore or work around database-dependent tests** — Testcontainers provides the database; if Docker is not running, stop and tell the user instead of skipping DB tests
- **Write no-op or trivially-true tests** — every test must contain meaningful assertions that would fail if the feature were broken (never assert only that a page loads without checking content)
- **Discard a Playwright error** — wrap every action and assertion in `must(t, ...)`; an ignored error is a silently passing test
- **Write a test without the traceability helper** — every scenario subtest starts with `useCase(...)`, every pure regression test with `bug(...)`. A test without it loses the link to its documents and the reference validation

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Worktree Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/WORKTREE_GATE.md`.

## Test Environment

`e2e/setup_test.go` ([templates/setup_test.go](templates/setup_test.go)) holds the whole
environment in `TestMain`:

1. `testdb.Start()` — a PostgreSQL Testcontainer with the goose migrations and `db/seed.sql`
   applied (`internal/testdb`, created by `/integration-test`; it compiles under the `e2e` tag too)
2. `httptest.NewServer(web.NewHandler(...))` — the real handler with the full middleware chain,
   on a random local port
3. `playwright.Run()` and `pw.Chromium.Launch()` — one browser for the package

It also provides:

- `newPage(t)` — a page in a fresh browser context (own cookies and storage, `BaseURL` set, so
  `page.Goto("/login")` works). Closed when the test ends; a failed test leaves a trace in
  `e2e/test-results/<test>.zip` (open it with `go tool playwright show-trace <file>`)
- `expect` — `playwright.NewPlaywrightAssertions()`, the web-first assertions that retry until
  the condition holds or the timeout expires
- `must(t, err)` — fails the test on a Playwright error
- `createUser(t, columns)` — see Test User Provisioning

If `internal/testdb/testdb.go` does not exist, create it from
`${CLAUDE_PLUGIN_ROOT}/skills/integration-test/templates/testdb.go`.

### Tooling

```bash
go get github.com/mxschmitt/playwright-go
go get -tool github.com/mxschmitt/playwright-go/cmd/playwright
go tool playwright install --with-deps chromium
```

`go tool playwright` runs the CLI at the version pinned in `go.mod`, so the downloaded driver
always matches the library. Use the context7 MCP server to confirm the module path and API for
the installed version. Add `e2e/test-results/` to `.gitignore`.

## Test User Provisioning

Every E2E test requires an authenticated user. `createUser(t, columns)` inserts one directly
into the database with a random `e2e-xxxxxxxx@example.com` email and a known password, and
registers a `t.Cleanup` that deletes it. Adapt the template once to the project's users table
and to the password hashing the login handler verifies.

### Suite-Level User (default)

Create one user at the top of the `TestUC<NNN>` function and share it with the subtests. It is a
standard, fully valid user for happy-path scenarios, and it is deleted when the top-level test
ends. Each subtest still calls `newPage(t)`, so no session leaks between subtests.

### Per-Test User Override

A subtest that needs a user with **different characteristics** (e.g., inactive status,
unconfirmed email, a different role) creates its own inside the subtest:

```go
suspended := createUser(t, map[string]any{"status": "SUSPENDED", "email_confirmed": true})
```

It is deleted when the subtest ends, even if it fails.

### Other Test Data

| Approach        | Location                               | Purpose                           |
|-----------------|----------------------------------------|-----------------------------------|
| SQL seed        | `db/seed.sql`, run by `testdb.Start`   | Baseline reference data (non-user) |
| UI interactions | Within the test journey                | Test-specific entity data         |
| Cascade cleanup | `createUser`'s `t.Cleanup`             | Remove the user and every record it owns |

Make test data belong to the test user (foreign key with `ON DELETE CASCADE`), so deleting the
user removes it. For state that is not user-owned, insert and delete it through `pool` with
`t.Cleanup` in the test that needs it.

## Test Data Conventions

- Use only `example.com` for test emails and accounts (e.g., `user@example.com`, `admin@example.com`). This is an IANA-reserved domain that will never route real mail.

## Templates

- Environment and helpers: [templates/setup_test.go](templates/setup_test.go) — copy to `e2e/setup_test.go` and adapt `createUser`
- Traceability helpers: [templates/trace_test.go](templates/trace_test.go) — copy verbatim to `e2e/trace_test.go`. Do not modify; a future plugin update may bring fixes
- Test example: [templates/uc001_test.go](templates/uc001_test.go)

## Common Patterns

Locators take an `AriaRole` value and an options struct:

```go
button := page.GetByRole(*playwright.AriaRoleButton, playwright.PageGetByRoleOptions{Name: "Save"})
```

Small `link`, `button`, and `heading` helpers (see the example) keep journeys readable.

### Login via UI (start of each test)

```go
t.Run("MSS/user signs in and lands on the dashboard", func(t *testing.T) {
	useCase(t, "UC-XXX", "MSS")
	page := newPage(t)

	// Start at login — the ONLY page.Goto allowed
	_, err := page.Goto("/login")
	must(t, err)
	must(t, page.GetByLabel("Email").Fill(owner.Email))
	must(t, page.GetByLabel("Password").Fill(owner.Password))
	must(t, button(page, "Sign in").Click())
	must(t, expect.Locator(heading(page, "Dashboard")).ToBeVisible())

	// ... continue the journey
})
```

### Navigate Through the UI (never via URL)

```go
// Click a navigation link to reach the next screen
must(t, link(page, "Items").Click())
must(t, expect.Locator(heading(page, "Items")).ToBeVisible())

// Click a button to open a form/modal
must(t, button(page, "Add New").Click())

// Click a table row to navigate to detail
must(t, page.Locator("table tbody tr").First().Click())
must(t, expect.Locator(page.GetByRole(*playwright.AriaRoleHeading)).ToContainText("Item Details"))
```

### Wait for an htmx Swap

```go
// hx-post replaces the form with a fragment — wait for what the swap renders
must(t, button(page, "Save").Click())
must(t, expect.Locator(page.GetByText("Name is required")).ToBeVisible())
```

### Verify Intermediate State Along the Journey

```go
rows := page.Locator("table tbody tr")
must(t, expect.Locator(rows.First()).ToBeVisible())
must(t, expect.Locator(rows).ToHaveCount(10))
```

### Form Interactions

```go
must(t, page.GetByLabel("Name").Fill("Test Value"))
_, err := page.GetByLabel("Category").SelectOption(playwright.SelectOptionValues{Values: &[]string{"option-1"}})
must(t, err)
must(t, page.GetByLabel("Active").Check())
must(t, button(page, "Save").Click())
```

### Verify Final Outcome and Stored State

```go
must(t, expect.Locator(page.GetByText("Item created successfully")).ToBeVisible())
must(t, expect.Locator(page.Locator("table tbody tr")).ToContainText([]string{"Test Value"}))

// Postcondition the UI cannot show — read it from the database
var count int
must(t, pool.QueryRow(context.Background(), "SELECT count(*) FROM items WHERE name = $1", "Test Value").Scan(&count))
if count != 1 {
	t.Fatalf("stored items named %q = %d, want 1", "Test Value", count)
}
```

### Dialog Interactions

```go
// hx-confirm uses the native confirm() dialog
page.OnDialog(func(d playwright.Dialog) { _ = d.Accept() })
must(t, button(page, "Delete").Click())
```

## Assertions Reference

| Assertion Type   | Example                                                            |
|------------------|--------------------------------------------------------------------|
| Text content     | `must(t, expect.Locator(loc).ToHaveText("Expected"))`              |
| Input value      | `must(t, expect.Locator(loc).ToHaveValue("value"))`                |
| Element count    | `must(t, expect.Locator(loc).ToHaveCount(5))`                      |
| Visibility       | `must(t, expect.Locator(loc).ToBeVisible())`                       |
| URL              | `must(t, expect.Page(page).ToHaveURL(baseURL + "/path"))`          |
| Enabled          | `must(t, expect.Locator(loc).ToBeEnabled())`                       |
| Contains text    | `must(t, expect.Locator(loc).ToContainText("partial"))`            |

## Tracking

Read and follow the **Before Implementation** steps in `${CLAUDE_PLUGIN_ROOT}/shared/tracking/TRACKING.md`.

## Workflow

1. Read the use case specification from `docs/use_cases/`
2. Read the frontend design from `docs/designs/` — extract screens, components, states, and navigation flow
3. **Plan the journeys** — map each subtest to a complete path through the application:
    - One subtest for the MSS: entry point → each screen in sequence → final outcome
    - One subtest per AF that diverges from the MSS
    - Note the entry point URL (the only `page.Goto()` allowed) and every UI interaction needed to complete each journey
    - Identify which business rules are verified inline within each journey
4. Use TodoWrite to create a task for each journey (expect 3–8 subtests total, not dozens)
5. Ensure the tooling is installed (see Tooling): `go tool playwright` works and Chromium is installed
6. Ensure `internal/testdb/testdb.go` exists with the `integration || e2e` build constraint; create it from the `/integration-test` template if missing
7. Ensure `e2e/setup_test.go` exists; create it from the template if missing and adapt `createUser`
8. Ensure `e2e/trace_test.go` exists; create it from the template if missing. Do not modify it
9. Create the test file `e2e/uc<NNN>_test.go` (e.g. `e2e/uc007_test.go`) with the `//go:build e2e` tag. **Put every scenario in a `TestUC<NNN>` subtest named `"<scenario>/<journey>"` whose first line is `useCase(t, "UC-NNN", "<scenario>", refs...)`**; pure regressions go in `TestBUG<NNN>` starting with `bug(t, "BUG-NNN")` (see Traceability Convention)
10. For each journey subtest:
    - Use the suite-level user from the top-level test, or create a per-test user override
    - Read the spec and identify which CR-NNN and BUG-NNN IDs (if any) the test verifies — pass them as `refs` to `useCase`
    - `page := newPage(t)`, then `page.Goto()` to the login page (the **only** goto in the test), log in via UI
    - After every navigation, action, or htmx swap, wait for a **specific UI element** with `expect` — never for network idle
    - Navigate through each screen by clicking links, buttons, and submitting forms
    - Verify intermediate states along the way (page loaded, data displayed, form visible)
    - Perform the key interactions (fill forms, click actions, confirm dialogs)
    - Assert the final outcome (success message, data in list, redirect to expected page)
    - Wrap every Playwright call in `must(t, ...)`
11. Run the `/code-quality` skill on the files you created or touched
12. Verify Docker is running (`docker info > /dev/null 2>&1`) — if not, stop and tell the user
13. Run **all** tests with `go test -tags=e2e ./e2e/...` (no `-run`, no `-skip`, no filters)
14. **Verify the test results — this is mandatory before declaring success:**
    - The output must end with `ok` for the `e2e` package and the exit code must be **0**
    - If the output shows `FAIL`, a panic, or a timeout, the tests **did not pass** — do not claim otherwise
    - Run once with `-v` and confirm every subtest you wrote appears with `--- PASS`
    - If any test is skipped (`--- SKIP`), that counts as a failure — investigate and fix it
    - **If a test failure reveals a route mismatch** (e.g., test expects `/register` but app uses `/sign-up`), this means the test is not navigating through the UI — fix the test to click through the real navigation instead of hardcoding URLs
    - **If a test fails with `[trace] CR-NNN not found under docs/...`** — the referenced doc does not exist. Either the ID is typo'd, the doc was renamed, or the CR/BUG was never created. Fix the reference, do not silence the helper.
    - **If `TestMain` fails before any test runs** — read the logged cause: Docker not running, a migration error from `testdb`, or the Playwright driver/Chromium missing (`go tool playwright install --with-deps chromium`)
15. If a test fails:
    - Open the trace the failure logged (`go tool playwright show-trace e2e/test-results/<test>.zip`)
    - Read the error message carefully and fix the root cause in the test or implementation
    - Re-run `go test -tags=e2e ./e2e/...` and go back to step 14
    - Do NOT skip, exclude, or filter out failing tests as a "fix"
16. Mark todos complete

## Post-Implementation Tracking

Read and follow the **After Implementation** steps in `${CLAUDE_PLUGIN_ROOT}/shared/tracking/TRACKING.md`.
