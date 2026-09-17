---
name: setup-web-middleware
description: >
  Builds the Go net/http middleware chain with authentication, authorization (RBAC), CSRF
  protection, security headers, structured slog logging, and panic recovery. Run before
  implementing use cases so that feature code can rely on cross-cutting infrastructure. Use when
  the user asks to "set up middleware", "add auth middleware", "build the middleware layer",
  "add security headers", "protect my routes", "add login redirect", "set up route guards", or
  mentions middleware, authentication guard, route protection, CSRF, or RBAC middleware.
---

# Build Web Middleware

## Instructions

Build the request middleware chain and cross-cutting infrastructure for the Go project.
This skill produces the infrastructure that use case implementations depend on:
authentication, authorization, CSRF protection, security headers, structured logging, and
panic recovery.

Every route is registered on the one `http.ServeMux` in `internal/web/routes.go`, and the whole
mux is wrapped by the chain built there. Authentication fails closed: a route needs a signed-in
user unless its path is listed in `auth.PublicPaths`. Roles are not a path table — a
role-protected route is wrapped with `auth.RequireRole` on the line that registers it, so the
mux stays the only router.

Run this skill **after** the entity model and the database migration exist (so user/role tables
are available) and **before** implementing use cases.

## Step 0: Consult Documentation

**Before writing any code**, read the `go` directive in `go.mod`, then use the context7 MCP
server to look up, for that Go version:

1. **`http.CrossOriginProtection`** — constructor, `Handler`, trusted origins, and bypass
   patterns (Go 1.25+). If `go.mod` declares an older version, stop and ask the user to raise
   the `go` directive — do not add a CSRF token library instead
2. **`ServeMux` patterns** — method and wildcard syntax (`"GET /items/{id}"`), `r.PathValue`,
   precedence rules, and `ServeMux.Handler`, which returns the pattern a request matches
3. **`log/slog`** — `JSONHandler` options and `slog.NewLogLogger` for `http.Server.ErrorLog`
4. **The session library chosen in Step 3** — its middleware, store, and cookie options

Every API choice in the steps below must match the documentation for the installed versions —
not hardcoded assumptions.

## DO NOT

- Overwrite an existing `internal/web/routes.go` chain without showing the user what will change and asking for confirmation
- Hard-code secrets, tokens, or credentials (read them through `internal/config`)
- Add an auth or session library without user confirmation — ask which auth approach to use
- Register a route outside `internal/web/routes.go`
- Check roles inside handlers, or keep a path-to-roles table — wrap the route with `auth.RequireRole` where it is registered
- Add rate limiting inside the middleware chain (use a dedicated service or external provider)
- Put feature-specific logic in middleware — keep it generic and cross-cutting
- Skip reading the entity model — the middleware must align with the project's user/role structure
- Set security headers in more than one place (a reverse proxy *and* the app) — pick the app
- Log session IDs, cookies, tokens, secrets, passwords, or full `Authorization` headers
- Add a CSRF token library — `http.CrossOriginProtection` covers it
- Load htmx or any script from a CDN — it is embedded from `internal/web/static/` so the CSP stays `'self'`

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Prerequisites

The following must exist before running this skill:

- `docs/requirements.md` (from `/requirements`) — to identify security and auth NFRs
- `docs/entity_model.md` (from `/entity-model`) — to understand user/role entities
- `db/migrations/` with the user/role tables (from `/db-migration`)
- `internal/config/config.go` and `internal/app/app.go` (from `/setup-env-profiles`)

If any prerequisite is missing, stop and tell the user which `/command` to run first.

## Workflow

### Step 1: Gather Context

1. Read `docs/requirements.md` and extract:
   - Authentication requirements (login, session management, session lifetime)
   - Authorization requirements (roles, permissions, RBAC rules)
   - Security NFRs (CSRF, headers, HTTPS enforcement)
   - Any explicit middleware-related requirements
2. Read `docs/entity_model.md` and identify:
   - The User entity (or equivalent) and its fields
   - Role/Permission entities and their relationship to User
   - Session or Token entities if defined
3. Read `db/migrations/` and verify the user/role tables exist
4. Read `go.mod` for existing auth libraries (`github.com/alexedwards/scs`,
   `github.com/gorilla/sessions`, `github.com/coreos/go-oidc`, `github.com/golang-jwt/jwt`, etc.)

### Step 2: Retrofit Detection

Determine whether the skill runs in **greenfield mode** (no existing features) or
**retrofit mode** (existing code that will be affected).

#### 2a. Scan for Existing Code

Search the codebase for:

- **Routes** — every `Handle` / `HandleFunc` registration in `internal/web/routes.go` (and any
  stray `http.HandleFunc` / `ServeMux` elsewhere — flag those, all routes belong in routes.go)
- **Handlers** — `internal/**/handler.go`
- **htmx fragment endpoints** — handlers rendering partials for `hx-get` / `hx-post`
- **Existing middleware chain** — `func(http.Handler) http.Handler` wrappers applied in
  `internal/web/routes.go` or `internal/app/app.go`
- **Ad-hoc auth checks** — grep for `r.Cookie(`, `Header.Get("Authorization")`, `jwt.Parse`,
  session manager `Get` calls, or manual role checks in handlers and services

#### 2b. If an Existing Middleware Chain Is Found

Show the user the current chain and ask:

> **An existing middleware chain was found. Choose how to proceed:**
>
> 1. **Extend** — keep existing middleware and add auth/security layers around it
> 2. **Replace** — discard the current chain and build from scratch
> 3. **Abort** — stop and let me review the existing chain first

Wait for the user to choose before proceeding.

#### 2c. If Existing Features Found (Retrofit Mode)

If routes beyond `GET /healthz` and static assets exist, activate **retrofit mode**.

**Impact analysis** — map the route protection rules (from Step 4) against the existing routes:

| Route pattern                  | Handler                          | Current Auth | Will Become   | Impact     |
|--------------------------------|----------------------------------|--------------|---------------|------------|
| `GET /dashboard`               | `internal/dashboard/handler.go`  | None         | Authenticated | **Breaking** — will redirect to login |
| `GET /users`                   | `internal/user/handler.go`       | Manual check | `ADMIN` role  | Review — has ad-hoc auth, may conflict |
| `GET /items/{id}/row` (htmx)   | `internal/item/handler.go`       | None         | Authenticated | **Breaking** — fragment will return `HX-Redirect` |
| `GET /about`                   | `internal/page/handler.go`       | None         | Public        | No impact  |

Present this table to the user and ask:

> **Retrofit impact analysis:**
>
> [impact table]
>
> **Breaking changes** — these routes currently work without auth and will start redirecting
> or returning 403 once the chain is applied.
>
> **Review items** have existing ad-hoc auth that may conflict with or duplicate the new logic.
>
> Options:
> 1. **Proceed** — I'll adjust the rules to minimize breakage and generate a migration checklist
> 2. **Adjust rules** — let me customize which routes stay public before proceeding
> 3. **Abort** — let me review the existing code first

Wait for the user to choose before proceeding.

#### 2d. Ad-hoc Auth Consolidation Plan

List each file with ad-hoc auth and its pattern:

> | File                              | Current Pattern                      | Recommendation |
> |-----------------------------------|--------------------------------------|----------------|
> | `internal/user/handler.go`        | reads cookie + manual role check     | Remove — `RequireAuth` and `RequireRole` handle it |
> | `internal/order/service.go`       | `if userID == ""` guard              | Keep — services are also called from jobs/CLI that bypass HTTP |
> | `internal/dashboard/handler.go`   | redirect if no cookie                | Remove — the chain redirects |

**Important:** only requests that enter through the mux pass the chain. Business logic in
`internal/<feature>/service.go` that is also reached from a background job, a CLI command, or a
message consumer does **not** pass through it — keep the explicit authorization check there.
Ownership checks ("this order belongs to this user") are business rules, not middleware, and
always stay in the service. Flag this distinction clearly in the plan.

#### 2e. Generate Migration Checklist

If in retrofit mode, create a technical task following the standard `TT-XXX` naming convention:

1. Read existing files in `docs/technical_tasks/` to determine the next available `TT-XXX` ID (zero-padded, 3 digits — e.g. if `TT-003.md` is the highest, the next is `TT-004`)
2. Create `docs/technical_tasks/TT-XXX-middleware-retrofit.md` using the template from `nexa-claude-core/skills/technical-task/templates/technical-task.md` with:
   - **Task ID:** `TT-XXX` (the assigned numeric ID)
   - **Task Name:** Middleware Retrofit — Consolidate Ad-hoc Auth
   - **Category:** Cleanup
   - **Goal:** Adapt existing routes and handlers to the new middleware chain, removing redundant ad-hoc auth checks and updating tests
   - **Status:** Approved
   - **Acceptance Criteria:** one checklist item per file that needs updating, grouped by change type:
     - **Remove redundant auth** — handlers where the chain now does what the code did manually
     - **Wrap with RequireRole** — routes whose handler checked a role by hand
     - **Keep explicit auth** — services reachable outside HTTP, and ownership checks
     - **Update tests** — tests that now need an authenticated session in their setup
     - **Review conflicts** — files with auth logic that may conflict with the new behavior
   - **Affected Areas:** every file identified in the retrofit analysis
   - **Dependencies:** None

**Do not apply the migration changes in this skill.** The checklist is implemented via
`/implement TT-XXX-middleware-retrofit` (using the assigned ID) as a follow-up step.

### Step 3: Confirm Auth Strategy with User

If an auth library is already in `go.mod`, lead with it:

> **I found `<library>` in go.mod. Should I build the middleware around it?**
>
> If not, choose an alternative:

Otherwise present:

> **Authentication strategy — choose one:**
>
> 1. **Server-side sessions in PostgreSQL** — `github.com/alexedwards/scs/v2` with its `pgxstore`.
>    Opaque random session token in the cookie, session data in a `sessions` table, instant
>    revocation (logout, role change), no secret to manage. Recommended for a server-rendered
>    templ + htmx app.
> 2. **Signed-cookie sessions (stdlib only)** — session payload (user ID, roles, expiry) in a
>    cookie signed with HMAC-SHA256 (`crypto/hmac`) using `SESSION_SECRET`. No dependency and no
>    session table, but no server-side revocation before expiry.
> 3. **External OpenID Connect provider** — `github.com/coreos/go-oidc/v3` + `golang.org/x/oauth2`
>    for login, then option 1 or 2 to hold the local session.

Wait for the user to choose before proceeding. For option 1, the `sessions` table needs a
migration — tell the user to run `/db-migration` for it if it does not exist.

### Step 4: Define Route Protection Rules

Ask the user to confirm or adjust the defaults:

> **Route protection rules (adjust as needed):**
>
> | Path                | Rule                               | Enforced by |
> |---------------------|------------------------------------|-------------|
> | `/` (exact)         | Public                             | `auth.PublicPaths` |
> | `/healthz`          | Public                             | `auth.PublicPaths` |
> | `/static/`          | Public                             | `auth.PublicPaths` |
> | `/login`, `/signup` | Public, redirect if signed in      | `auth.PublicPaths` + `auth.GuestOnly` at registration |
> | `/auth/`            | Public                             | `auth.PublicPaths` |
> | `/admin/`           | Signed in + `ADMIN` role           | `auth.RequireRole("ADMIN")` at registration |
> | everything else     | Signed in (fail closed)            | `auth.RequireAuth` |
>
> Should I proceed with these defaults, or do you want to customize them?

Incorporate the user's adjustments.

### Step 5: Build the Infrastructure

Create the files below. Consult the context7 MCP server again if any API is unclear.

#### 5a. `internal/web/routes.go` — the chain

`NewHandler(deps Deps) http.Handler` registers every route on one `http.ServeMux` and returns it
wrapped in the chain. Every caller that needs the application's HTTP handler — `internal/app`,
`/integration-test`, `/playwright-test` — builds it through this one signature:

```go
type Deps struct {
	Config config.Config
	Pool   *pgxpool.Pool
}

func NewHandler(deps Deps) http.Handler {
	mux := http.NewServeMux()
	queries := db.New(deps.Pool)

	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.Handle("GET /static/", http.FileServerFS(staticFS))
	// Guest-only and role-protected routes are wrapped where they are registered:
	//   mux.Handle("GET /login", auth.GuestOnly(http.HandlerFunc(login.Show)))
	//   mux.Handle("GET /admin/", auth.RequireRole("ADMIN")(admin))
	// ... feature routes using queries ...

	var h http.Handler = mux
	h = auth.RequireAuth(h)
	h = sessionLoader(h) // the chosen library's middleware, e.g. scs LoadAndSave
	h = http.NewCrossOriginProtection().Handler(h)
	h = SecurityHeaders(deps.Config.Env == "production")(h)
	h = Recover(h)
	h = LogRequests(mux)(h)
	return h
}
```

Static assets live in `internal/web/static/` and are embedded next to the router in
`internal/web/static.go` (`//go:embed` cannot reach a parent directory, so the assets must sit
under the embedding package):

```go
//go:embed static
var staticFS embed.FS
```

The resulting chain, outermost first:

1. **Request log** (`LogRequests`, `internal/web/middleware.go`) — outermost, so it records every
   response: a recovered panic's 500, a CSRF 403, an auth redirect
2. **Recover** (`internal/web/middleware.go`)
3. **Security headers** (`SecurityHeaders`, `internal/web/headers.go`)
4. **CSRF** — `http.NewCrossOriginProtection()` `.Handler(...)`. It rejects cross-origin
   unsafe requests using `Sec-Fetch-Site` / `Origin`, so templ forms and htmx requests need no token
5. **Session loading** — the chosen library's middleware (e.g. scs `LoadAndSave`)
6. **Auth** (`auth.RequireAuth`)
7. the mux, where `auth.GuestOnly` and `auth.RequireRole` wrap individual routes

Update `internal/app/app.go` so the server's `Handler` is
`web.NewHandler(web.Deps{Config: cfg, Pool: pool})` instead of the placeholder mux.

`auth.RequireAuth` follows this composition pattern:

1. Load the session once (`loadSession`). On an error (store unreachable, decode or signature
   failure) log at error and treat the request as anonymous
2. A valid session → store it in the request context, call next
3. Anonymous on a path in `PublicPaths` → log at debug, call next
4. Anonymous on any other path → log a warning with the path, redirect to login — never call next

`auth.GuestOnly(next)`: a signed-in user is redirected to `DefaultLoginRedirect` (log at debug);
anyone else reaches `next`.

`auth.RequireRole(roles ...string) func(http.Handler) http.Handler`: if the context session
lacks every listed role, log a warning with path, user ID, required and actual roles, and
respond 403. With no session at all it responds like step 4 of `RequireAuth` — it fails closed
even if the route was mistakenly made public.

**Redirects and htmx.** A `303 See Other` to `/login` on an htmx request would swap the login
page into a fragment. When the request has `HX-Request: true`, respond `401` with the header
`HX-Redirect: /login` instead (for a failed role check, respond `403` with an error fragment).
Plain requests get `http.Redirect(w, r, LoginPath, http.StatusSeeOther)`.

#### 5b. `internal/auth/session.go`

- `type Session struct { UserID string; Roles []string; ExpiresAt time.Time }`
- `FromContext(ctx context.Context) (*Session, bool)` — the session `RequireAuth` stored;
  `false` for an anonymous request. Handlers use only this — they never read the cookie or the
  store again
- `(s *Session) HasRole(roles ...string) bool` — nil-safe; true if the session holds any of the roles
- `loadSession(r *http.Request) (*Session, error)` — unexported. Returns `nil, nil` when there
  is no session or it has expired, and an error for a store, decode, or signature failure.
  It never panics on a garbage cookie
- Login/logout helpers the chosen library needs (e.g. `Login(ctx, userID, roles)` that renews
  the session token to prevent fixation, `Logout(ctx)`)

#### 5c. `internal/auth/rules.go`

Route and auth constants:

- `PublicPaths` — `[]string` of paths that need no session. An entry ending in `/` matches
  that prefix; any other entry matches the path exactly. It is a slice, checked in order, so
  the result is deterministic
- `DefaultLoginRedirect` — where to go after login (e.g. `/dashboard`)
- `LoginPath` — the login page path

#### 5d. `internal/web/headers.go`

`SecurityHeaders(production bool) func(http.Handler) http.Handler` sets, on every response:

- `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`
  — with a comment that it is a baseline to tune per project
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` — only when `production`
  (`cfg.Env == "production"`)

**htmx under this CSP.** htmx is vendored at `internal/web/static/htmx.min.js`. Add to the
shared layout (`internal/web/layout.templ`):

```html
<meta name="htmx-config" content='{"includeIndicatorStyles":false,"allowEval":false,"responseHandling":[{"code":"204","swap":false},{"code":"[23]..","swap":true},{"code":"422","swap":true},{"code":"[45]..","swap":false,"error":true}]}'>
```

`responseHandling` makes htmx swap `422` responses. htmx 2 does not swap any 4xx by default, so
without this entry a form re-rendered with validation errors (the `/implement` pattern) never
appears on the page. Confirm the setting against the installed htmx version with context7.

`includeIndicatorStyles:false` stops htmx injecting an inline `<style>` (blocked by
`style-src 'self'`) — put the `.htmx-indicator` rules in `internal/web/static/app.css`.
`allowEval:false` matches `script-src 'self'`: do not use `hx-on:*` attributes or `js:` values;
write behaviour in a static `.js` file.

#### 5e. Logging — `log/slog`

There is no custom logger. `internal/app/app.go` already sets a JSON `slog` default, with debug
enabled outside production. Auth middleware logs with `slog.DebugContext` / `WarnContext` /
`ErrorContext` and these attributes on every record: `component` (`"auth"`), `method`, `path`.
Events:

| Event                     | Level   | Additional attributes                                  |
|---------------------------|---------|--------------------------------------------------------|
| Public path — anonymous   | `DEBUG` | —                                                      |
| Guest-only — redirected   | `DEBUG` | `user_id`, `redirect_to`                               |
| Session missing           | `WARN`  | `redirect_to`                                          |
| Session expired           | `WARN`  | `user_id` (if known), `expired_at`                     |
| Session malformed         | `WARN`  | `error` (the decode error message, never the value)    |
| Signature invalid (signed cookies) | `ERROR` | `error`                                       |
| Role check failed         | `WARN`  | `user_id`, `required_roles`, `actual_roles`            |
| Session store error       | `ERROR` | `error`                                                |
| Authenticated — allowed   | `DEBUG` | `user_id`                                              |

`LogRequests(mux *http.ServeMux) func(http.Handler) http.Handler` in `internal/web/middleware.go`
logs one `INFO` record per request: `method`, `path`, `pattern`, `status`, `duration_ms`. Take
`pattern` from `_, pattern := mux.Handler(r)`, not from `r.Pattern`: the mux sets `r.Pattern` on
the request it receives, and session loading passes a copy (`r.WithContext`), so an outer
middleware always reads it empty.

**Security rule:** never log session IDs, cookie values, tokens, secrets, or full
`Authorization` headers. Log user IDs and error messages only.

#### 5f. Panic Recovery / Server Error Tracking — `internal/web/middleware.go`

`Recover(next http.Handler) http.Handler`:

- `defer` + `recover()`; re-panic `http.ErrAbortHandler` (the stdlib uses it to abort a response)
- Logs at `ERROR` with `error`, `stack` (`debug.Stack()`), `method`, `path`
- Responds `500` with a generic message (no stack trace to the client) — `LogRequests`, outside
  it, records that 500
- A comment marks where to forward errors to an external provider (e.g. Sentry, Datadog)

Handlers that return an error they cannot handle log it the same way and respond 500 — they do
not panic on purpose. `http.Server.ErrorLog` is already routed to slog by `internal/app/app.go`.

### Step 6: Install Dependencies

Install the packages for the chosen strategy (`go get ...`, then `go mod tidy`). Always ask the
user for confirmation first. The stdlib signed-cookie strategy needs none.

### Step 7: Update Environment Variables

Check `.env`, `.env.dev`, and `.env.example` (if present) and add the variables the chosen
strategy needs:

- `SESSION_SECRET` — **signed-cookie sessions only**: at least 32 random bytes
  (`openssl rand -base64 32`). Add a `SessionSecret` field and a missing-value check in
  `Config.Validate`. The scs strategy stores an opaque random token and needs no secret
- `BASE_URL` — used for absolute redirects and OIDC callbacks
- Provider-specific variables for OIDC (`OIDC_ISSUER_URL`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`)

Add each new variable as a field in `internal/config/config.go`. Comment out variables that need
user-provided values with a `# TODO:` prefix. If `.env.example` exists, add the names there
without values.

### Step 8: Write Unit Tests

Test pure functions with clear inputs and outputs, using stdlib `testing` and
`net/http/httptest`, table-driven.

| Source File                  | Test File                         |
|------------------------------|-----------------------------------|
| `internal/web/headers.go`    | `internal/web/headers_test.go`    |
| `internal/auth/session.go`   | `internal/auth/session_test.go`   |

**Do not** create a test for `rules.go` — it is static data; a test that the slice contains
specific values breaks on every intentional change and catches no bug.

**Do not** unit-test the assembled chain in `routes.go` or `slog` output — the routing behaviour
is validated end to end by `/playwright-test`, and slog is the standard library.

#### 8a. `headers_test.go`

Wrap a no-op handler with `SecurityHeaders`, serve with `httptest.NewRecorder`, and assert:

- All required headers are present with the expected values
- `Strict-Transport-Security` is present when `production` is true
- `Strict-Transport-Security` is absent when `production` is false

#### 8b. `session_test.go`

The setup depends on the Step 3 strategy (for scs, wrap the test handler in `LoadAndSave` with
an in-memory store; for signed cookies, sign test payloads with a test secret). Test:

- `loadSession` returns the session for a valid cookie
- `loadSession` returns `nil, nil` when no cookie is present and for an expired session
- `loadSession` returns `nil` and an error for a tampered signature / unknown session token
- `loadSession` does not panic on a garbage cookie value
- `FromContext` returns what `RequireAuth` stored, and `false` for an anonymous request
- `HasRole` — true when any required role is held, false otherwise, false on a `nil` session

### Step 9: Verify

1. Build: `go tool templ generate && sqlc generate && go build ./... && go vet ./...`
2. Confirm `internal/app/app.go` serves `web.NewHandler(web.Deps{Config: cfg, Pool: pool})` and
   that `http.NewCrossOriginProtection` is in the chain
3. Confirm `/static/` is public, no route is registered outside `internal/web/routes.go`, and no
   handler checks a role by hand
4. Run all existing tests:
   - **Unit tests** — `go test ./...` (includes the Step 8 tests)
   - **Integration tests** — if any `*_integration_test.go` exists: `go test -tags=integration ./...`
   - **End-to-end tests** — if `e2e/` holds `*_test.go` files: `go test -tags=e2e ./e2e/...`
   - If any test fails, fix it before proceeding. In retrofit mode, failures likely mark routes in
     the migration checklist — note them in the summary, never skip or suppress the tests
5. Describe a manual smoke test to the user (with `go run ./cmd/dev` running):
   - `curl -i localhost:8080/dashboard` → `303` to `/login`
   - `curl -i -H 'HX-Request: true' localhost:8080/dashboard` → `401` with `HX-Redirect: /login`
   - `curl -i localhost:8080/` → `200` with the security headers present
   - `curl -i -X POST -H 'Sec-Fetch-Site: cross-site' localhost:8080/login` → `403`

### Step 10: Update CLAUDE.md

Append a `## Web Middleware` section to the target project's `CLAUDE.md`.

1. If `CLAUDE.md` does not exist, create it
2. If a `## Web Middleware` section already exists (check for `<!-- NEXA_WEB_MIDDLEWARE_CONFIGURED -->`),
   ask the user whether to overwrite or skip
3. Append the following section (fill in the actual values from the setup):

~~~markdown
## Web Middleware

<!-- NEXA_WEB_MIDDLEWARE_CONFIGURED -->

- Auth strategy: [chosen strategy, e.g. scs server-side sessions in PostgreSQL]
- Chain (outermost first), built by `web.NewHandler` in `internal/web/routes.go`: LogRequests → Recover → SecurityHeaders → CrossOriginProtection → session load → auth.RequireAuth → mux
- Logging: `log/slog` JSON (configured in `internal/app/app.go`), `component=auth` for auth events

### Auth (`internal/auth/`)
- `session.go` — `FromContext(ctx)`, `(*Session).HasRole(roles...)`, login/logout helpers
- `rules.go` — `PublicPaths`, `DefaultLoginRedirect`, `LoginPath`
- `middleware.go` — `RequireAuth` (whole mux, fail closed), `GuestOnly` and `RequireRole` (per route)

### Web (`internal/web/`)
- `headers.go` — `SecurityHeaders(production)` (CSP, X-Frame-Options, HSTS in production, etc.)
- `middleware.go` — `LogRequests(mux)`, `Recover`
- `static/` — embedded assets (htmx, app.css), served at `/static/`

### Route protection rules
| Path                | Rule                              |
|---------------------|-----------------------------------|
| [actual paths and rules from the setup]                 |

### Middleware conventions for implementation
- Register every route in `internal/web/routes.go`; signed-in by default — add a path to `auth.PublicPaths` deliberately
- Role-protected routes: `mux.Handle(pattern, auth.RequireRole("ROLE")(h))` on the registration line; never check roles in a handler
- Read the user with `auth.FromContext(r.Context())`; ownership checks and services reachable outside HTTP keep explicit authorization
- htmx: unauthenticated htmx requests get `401` + `HX-Redirect`; do not use `hx-on:*` or `js:` values (CSP forbids eval)
- CSRF is handled by `http.CrossOriginProtection` — no tokens in forms
- Security headers are set only in `web.SecurityHeaders`
- The `/implement` skill can assume auth infrastructure exists
~~~

Do not remove or modify any other content in `CLAUDE.md`.

### Step 11: Summary

```
## Web Middleware Created

### Go Version & Conventions
- Go version: <go.mod go directive>
- Chain: internal/web/routes.go (web.NewHandler)
- CSRF: http.CrossOriginProtection

### Auth Strategy
<chosen strategy>

### Files Created/Updated
| File                              | Purpose                                   |
|-----------------------------------|-------------------------------------------|
| internal/web/routes.go            | ServeMux, route registration, chain       |
| internal/web/static.go            | Embedded static assets                    |
| internal/web/middleware.go        | Request logging and panic recovery        |
| internal/web/headers.go           | Security headers (including CSP)          |
| internal/app/app.go               | Serves web.NewHandler                     |
| internal/auth/session.go          | Session loading and context helpers       |
| internal/auth/rules.go            | Public paths and auth constants           |
| internal/auth/middleware.go       | RequireAuth, GuestOnly, RequireRole       |
| internal/web/headers_test.go      | Unit tests for security headers           |
| internal/auth/session_test.go     | Unit tests for session helpers            |

### Route Protection
| Path          | Rule                              |
|---------------|-----------------------------------|
| ...           | ...                               |

### Environment Variables
| Variable      | Status                            |
|---------------|-----------------------------------|
| ...           | Added / Already exists / TODO     |

### Error Handling & Observability
- The chain fails closed — session store errors make the request anonymous, and protected paths redirect to login
- Auth decisions produce structured slog JSON records with method, path, and error context
- Debug records are suppressed in production
- Panics are recovered, logged with stack and request context, and answered with 500

### Test Results
- Unit tests: X passed, Y failed
- Integration tests: X passed, Y failed (or N/A if none exist)
- End-to-end tests: X passed, Y failed (or N/A if no e2e tests exist)
- [If any failures, list them and explain whether they are pre-existing or caused by the changes]

### What This Enables for Feature Implementation
- `auth.FromContext(r.Context())` returns the signed-in user in every handler
- Protected routes redirect to login (htmx requests get HX-Redirect)
- Role-based routes enforce access with `auth.RequireRole` at registration
- CSRF protection and security headers apply to every response
- The `/implement` skill can assume auth infrastructure exists

### Retrofit (if applicable)
- Mode: Greenfield / Retrofit
- Existing routes affected: N
- Breaking changes: N files
- Ad-hoc auth to consolidate: N files
- Migration checklist: docs/technical_tasks/TT-XXX-middleware-retrofit.md

### Next Steps
- Implement the login/signup/logout handlers as a use case with `/implement`
- If in retrofit mode: run `/implement TT-XXX-middleware-retrofit` to adapt existing code
- Fill in `# TODO:` env vars (OIDC, production secrets)
- Tune the Content-Security-Policy for the project
- Run `/implement` for your next use case
```
