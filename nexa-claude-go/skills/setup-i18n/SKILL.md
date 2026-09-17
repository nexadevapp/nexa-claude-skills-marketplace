---
name: setup-i18n
description: >
  Sets up server-side internationalization for a Go web application with go-i18n: embedded
  TOML message catalogs, a locale detection middleware for net/http, context helpers that templ
  views call directly, and pluralization through CLDR rules. Run before implementing use cases
  so that every templ view and validation message is localized from the start. Use when the
  user asks to "set up i18n", "add internationalization", "add translations", "set up
  localization", "add multi-language support", or mentions i18n, internationalization,
  localization, go-i18n, or multi-language in a Go project.
---

# Setup Internationalization (i18n)

## Instructions

Set up the translation infrastructure that every later use case implementation depends on:
message catalogs, locale detection per request, and one translation helper that handlers,
templ views, and validation messages all use.

The locale lives in the request `context.Context`. templ components receive `ctx` implicitly,
so a view translates with `{ i18n.T(ctx, "common.save") }` — no localizer is passed through
component parameters.

Run this skill **after** `/setup-env-profiles` and **before** implementing use cases. If
`/setup-web-middleware` already ran, this skill adds one middleware to the existing chain in
`internal/web/routes.go`; it does not rebuild the chain.

## Step 0: Consult Documentation

**Before writing any code**, read `go.mod`, then use the context7 MCP server to look up:

1. **go-i18n v2** (`github.com/nicksnyder/go-i18n/v2/i18n`) — `NewBundle`,
   `RegisterUnmarshalFunc`, `LoadMessageFileFS`, `ParseMessageFileBytes`, `NewLocalizer`,
   `Localize` / `LocalizeConfig` (`MessageID`, `TemplateData`, `PluralCount`), and how nested
   TOML tables flatten into dotted message IDs
2. **`golang.org/x/text/language`** — `NewMatcher`, `ParseAcceptLanguage`, and `MatchStrings`
3. **templ** — how `ctx` is available inside component expressions and attribute values

Every API name in the steps below must match the documentation for the installed versions.

## DO NOT

- Rebuild or reorder the existing middleware chain — insert the i18n middleware at the position named in Step 6
- Install libraries without user confirmation
- Hardcode user-facing strings in `.templ` files, handlers, or `Validate()` — always go through `i18n.T` / `i18n.TN`
- Pass a localizer or a locale through templ component parameters — views read it from `ctx`
- Load catalogs from disk at runtime — embed them with `//go:embed` so the binary is self-contained
- Use `html/template`, gettext `.po` files, or a second i18n library next to go-i18n
- Add real translations in this skill — only the infrastructure and placeholder keys
- Skip reading the requirements — the supported locales come from requirements or the user
- Add URL-prefix routing unless the requirements need localized public URLs (SEO) — it touches every link

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Prerequisites

- `docs/requirements.md` (from `/requirements`) — to identify supported locales and the default
- `go.mod` — read its `module` path; every import below uses it in place of `example.com/app`

If `docs/requirements.md` is missing, stop and tell the user to run `/requirements` first.

## Workflow

### Step 1: Gather Context

1. Read `docs/requirements.md` and extract the supported locales, the default locale, any
   locale detection preference (URL prefix, user setting, browser language), and RTL languages
2. Read `go.mod` for an existing i18n library (`go-i18n`, `golang.org/x/text/message`,
   `github.com/leonelquinteros/gotext`)
3. Check whether `internal/i18n/` already exists
4. Check whether `internal/web/routes.go` builds a middleware chain (`/setup-web-middleware`)

If an i18n library other than go-i18n is already in use, stop and ask the user whether to keep
it (then this skill only writes the `CLAUDE.md` section in Step 10, describing that setup) or to
replace it.

If the requirements do not name the locales, ask:

> **Internationalization setup — I need the following:**
>
> 1. **Supported locales** — which languages should the app support? (e.g. `en, de, fr`)
> 2. **Default locale** — which locale is the fallback? (e.g. `en`)
> 3. **Localized URLs** — do public pages need locale-prefixed URLs for SEO (`/de/...`)? (default: no)

Wait for the user to respond.

### Step 2: Confirm Strategy with User

> **Internationalization strategy:**
>
> | Setting            | Value                                                        |
> |--------------------|--------------------------------------------------------------|
> | Library            | `github.com/nicksnyder/go-i18n/v2` (CLDR plural rules)       |
> | Catalogs           | `internal/i18n/locales/<locale>.toml`, embedded in the binary |
> | Supported locales  | [from requirements or user input]                            |
> | Default locale     | [from requirements or user input]                            |
> | Locale detection   | `?lang=` query (sets the `lang` cookie) → `lang` cookie → `Accept-Language` → default |
> | URL prefix         | [None / `/de/...`, stripped before the mux]                  |
> | Views              | `{ i18n.T(ctx, "namespace.key") }` in templ                  |
>
> **Why server-side with go-i18n:**
> - The HTML is rendered in the right language on the server — htmx swaps localized fragments
> - Catalogs are embedded — no file lookup at runtime, no missing file in production
> - Plural forms follow CLDR for every locale, not only `one`/`other`
>
> Should I proceed with this setup?

Wait for the user to confirm or adjust.

### Step 3: Install Dependencies

Ask for confirmation, then:

```bash
go get github.com/nicksnyder/go-i18n/v2 golang.org/x/text github.com/BurntSushi/toml
go mod tidy
```

### Step 4: Create the Message Catalogs

```
internal/i18n/
├── i18n.go
├── i18n_test.go
└── locales/
    ├── en.toml      # default locale — every key exists here first
    ├── de.toml
    └── ...
```

Nested tables flatten into dotted message IDs (`[common] save` → `common.save`). A table whose
keys are plural forms (`one`, `other`, …) is one plural message. Placeholders use go-i18n
template syntax.

```toml
[common]
appName = "[App Name]"
loading = "Loading..."
error = "An error occurred"
notFound = "Page not found"
save = "Save"
cancel = "Cancel"
delete = "Delete"
edit = "Edit"
create = "Create"
back = "Back"
submit = "Submit"
search = "Search"
close = "Close"
confirm = "Confirm"
empty = "Nothing here yet"

[common.itemCount]
one = "{{.Count}} item"
other = "{{.Count}} items"

[navigation]
home = "Home"
dashboard = "Dashboard"
settings = "Settings"
login = "Log in"
logout = "Log out"

[validation]
required = "This field is required"
email = "Enter a valid email address"
minLength = "Must be at least {{.Min}} characters"
maxLength = "Must be at most {{.Max}} characters"

[auth]
loginTitle = "Log in"
emailLabel = "Email"
passwordLabel = "Password"
invalidCredentials = "Email or password is incorrect"
```

Non-default catalogs get the same keys with the default text prefixed by `[TRANSLATE]`
(`save = "[TRANSLATE] Save"`), so untranslated entries are easy to find. Add the plural forms
each locale needs per CLDR (e.g. `few` and `many` for `pl`, `few` for `ro`).

### Step 5: Create `internal/i18n/i18n.go`

One file, one package. Import go-i18n as `goi18n` to avoid the name clash.

```go
package i18n

//go:embed locales/*.toml
var catalogs embed.FS

// Locales lists the supported locales; the first one is the default.
var Locales = []language.Tag{language.English, language.German}

var matcher = language.NewMatcher(Locales)

// MustNewBundle loads every embedded catalog. The catalogs are compiled into the binary, so a
// malformed one is a build defect: it panics, and the unit test in Step 9 catches it first.
func MustNewBundle() *goi18n.Bundle

// Middleware resolves the request locale and stores a localizer in the context.
func Middleware(bundle *goi18n.Bundle) func(http.Handler) http.Handler

// T translates a message ID. data is optional template data (map[string]any).
func T(ctx context.Context, id string, data ...map[string]any) string

// TN translates a plural message; count selects the form and is available as {{.Count}}.
func TN(ctx context.Context, id string, count int, data ...map[string]any) string

// Locale returns the resolved locale tag (for <html lang>).
func Locale(ctx context.Context) string
```

Behaviour:

- **`Middleware`** resolves the locale in this order: a valid `?lang=` query value (also set the
  `lang` cookie: `Path=/`, `SameSite=Lax`, `HttpOnly`, one year), then the `lang` cookie, then
  `Accept-Language` through `language.MatchStrings(matcher, cookie, header)`, then
  `Locales[0]`. Store the localizer and the tag under unexported context keys. Set
  `Content-Language` on the response and add `Vary: Accept-Language, Cookie`
- **`T` / `TN`** — on a missing message, fall back to the default locale; if it is missing
  there too, log once at `WARN` with `slog` (`component=i18n`, `message_id`) and return the ID.
  Never panic and never return an empty string: a visible ID is a findable bug
- **A context without a localizer** (unit tests, background jobs) uses the default locale — do
  not panic
- **RTL** — if a supported locale is RTL, add `Dir(ctx) string` returning `"rtl"` or `"ltr"`

**URL prefix (only if confirmed in Step 2).** `Middleware` also accepts a leading
`/<locale>` segment: it takes the locale from it, strips it from `r.URL.Path` (and
`r.URL.RawPath`) on a shallow copy of the request, and passes the copy on — so every route in
`internal/web/routes.go` stays registered without the prefix. Add `Path(ctx, path string)
string` that prefixes non-default locales, and use it for every `href`, `hx-get`, `hx-post`,
and redirect target. `LogRequests` resolves the pattern with `mux.Handler(r)` on the request it
receives, which still has the prefix — strip it there too, with an exported `StripPrefix(path)
string` from this package.

### Step 6: Wire the Middleware

**If `internal/web/routes.go` has the `/setup-web-middleware` chain**, insert the middleware
between CSRF protection and session loading, so auth redirects and 403 fragments are already
localized and the prefix (if any) is stripped before `auth.RequireAuth` checks `PublicPaths`:

```go
var h http.Handler = mux
h = auth.RequireAuth(h)
h = sessionLoader(h)
h = i18n.Middleware(i18n.MustNewBundle())(h) // new
h = http.NewCrossOriginProtection().Handler(h)
h = SecurityHeaders(deps.Config.Env == "production")(h)
h = Recover(h)
h = LogRequests(mux)(h)
```

Show the user the diff and ask for confirmation before editing.

**If there is no chain yet**, wrap the mux in `internal/app/app.go` with the middleware and tell
the user that `/setup-web-middleware` will keep it at this position.

`web.NewHandler`'s signature does not change, so integration and E2E tests need no update.

### Step 7: Update the Shared Layout

In the shared layout (`internal/web/layout/layout.templ`):

- `<html lang={ i18n.Locale(ctx) }>` (and `dir={ i18n.Dir(ctx) }` if RTL is supported)
- Replace every hardcoded string in the layout (navigation, footer, titles) with `i18n.T`
- If the requirements ask for a language switcher, add links with `?lang=<locale>` — a plain
  link, no JavaScript

Run `go tool templ generate`.

### Step 8: Retrofit Detection

Scan for existing user-facing text:

- **templ views** — `internal/**/*.templ` text nodes and literal `placeholder`, `title`,
  `aria-label`, `alt` attribute values (never scan generated `*_templ.go`)
- **Forms** — `Validate()` methods returning literal messages
- **Handlers** — `http.Error(w, "...")` bodies and error fragments shown to users

If any exist, create a technical task:

1. Read `docs/technical_tasks/` to find the next free `TT-XXX` ID (zero-padded, 3 digits)
2. Create `docs/technical_tasks/TT-XXX-i18n-retrofit.md` from
   `nexa-claude-core/skills/technical-task/templates/technical-task.md` with:
   - **Task Name:** i18n Retrofit — Localize Existing Views and Messages
   - **Category:** Cleanup
   - **Goal:** Replace hardcoded user-facing strings with message IDs in every catalog
   - **Status:** Approved
   - **Acceptance Criteria:** one checklist item per file, grouped by **Views**, **Forms**
     (`Validate()` returns message IDs), **Handlers**
   - **Affected Areas:** every file found by the scan
   - **Dependencies:** None

**Do not apply the retrofit here.** It runs as `/implement TT-XXX-i18n-retrofit`.

### Step 9: Write Unit Tests

`internal/i18n/i18n_test.go`, stdlib `testing`, table-driven:

- **Catalog parity** — parse every embedded catalog with `goi18n.ParseMessageFileBytes` and
  assert every message ID in the default catalog exists in every other catalog, and no catalog
  has an ID the default lacks. Go has no type-checked message keys; this test is what catches a
  key added to one locale only
- **Catalogs load** — `MustNewBundle()` does not panic
- **Detection order** — through `httptest`: `?lang=de` beats the cookie and sets it; the cookie
  beats `Accept-Language`; `Accept-Language: de-AT,de;q=0.9` resolves to `de`; an unsupported
  locale falls back to the default
- **Fallback** — `T` with an unknown ID returns the ID; `T` on a bare `context.Background()`
  returns the default-locale text
- **Plurals** — `TN(ctx, "common.itemCount", 1)` and `TN(..., 2)` pick different forms
- **Prefix mode only** — `/de/items` reaches the next handler as `/items` with locale `de`

Do not test catalog *content* (the text of a message) — it changes with every copy edit.

### Step 10: Update CLAUDE.md

Append a `## Internationalization (i18n)` section to the project's `CLAUDE.md` (create the
file if missing). If `<!-- NEXA_I18N_CONFIGURED -->` already exists, ask whether to overwrite
or skip.

~~~markdown
## Internationalization (i18n)

<!-- NEXA_I18N_CONFIGURED -->

- Library: `github.com/nicksnyder/go-i18n/v2`, wrapped by `internal/i18n`
- Supported locales: [list]; default: [locale]
- Catalogs: `internal/i18n/locales/<locale>.toml` (embedded), dotted IDs (`namespace.key`)
- Detection: `?lang=` → `lang` cookie → `Accept-Language` → default [+ URL prefix `/de/...`]
- Middleware: `i18n.Middleware` sits between CSRF protection and session loading in `internal/web/routes.go`

### i18n conventions for implementation
- **templ:** `{ i18n.T(ctx, "items.title") }`; plurals `{ i18n.TN(ctx, "items.count", n) }`; attributes `placeholder={ i18n.T(ctx, "items.searchPlaceholder") }`
- **Handlers:** translate with `i18n.T(r.Context(), ...)`; never write literal user-facing text
- **Forms:** `Validate()` returns field → message ID (`validation.required`); the view translates it
- **Placeholders:** `{{.Name}}` in catalogs, passed as `map[string]any{"Name": ...}`
- **New keys:** add to the default catalog first, then to every other catalog (`[TRANSLATE]` prefix until translated) — `go test ./internal/i18n` fails otherwise
[- **Links (prefix mode):** build every href, hx-get, hx-post, and redirect with `i18n.Path(ctx, "/items")`]
~~~

Do not remove or modify any other content in `CLAUDE.md`.

## Verification

1. `go tool templ generate && go build ./... && go vet ./...` succeeds
2. `go test ./...` passes, including `internal/i18n`
3. If integration or E2E tests exist, run them: `go test -tags=integration ./...`,
   `go test -tags=e2e ./e2e/...` — fix every failure (E2E assertions on text now depend on the
   locale the browser sends)
4. Manual smoke test with `go run ./cmd/dev` running:
   - `curl -s -H 'Accept-Language: de' localhost:8080/ | grep '<html lang="de"'`
   - `curl -si 'localhost:8080/?lang=de' | grep -i 'set-cookie: lang=de'`
   - `curl -si localhost:8080/ | grep -i 'content-language'`

Then summarize:

```
## Internationalization Infrastructure Created

### Strategy
- Library: go-i18n v2
- Supported locales: [list]; default: [locale]
- Detection: ?lang= → cookie → Accept-Language → default [+ URL prefix]

### Files Created/Updated
| File                              | Purpose                                     |
|-----------------------------------|---------------------------------------------|
| internal/i18n/i18n.go             | Bundle, middleware, T/TN/Locale helpers     |
| internal/i18n/i18n_test.go        | Parity, detection, fallback, plural tests   |
| internal/i18n/locales/*.toml      | Message catalogs                            |
| internal/web/routes.go            | i18n.Middleware added to the chain          |
| internal/web/layout/layout.templ  | lang attribute, localized shared strings    |

### Test Results
- Unit / integration / E2E: X passed, Y failed (or N/A)

### Retrofit (if applicable)
- Files to localize: N — docs/technical_tasks/TT-XXX-i18n-retrofit.md

### Next Steps
- Run /implement for the next use case — it detects the marker and localizes every string
- If in retrofit mode: /implement TT-XXX-i18n-retrofit
- Replace the [TRANSLATE] placeholders
```
