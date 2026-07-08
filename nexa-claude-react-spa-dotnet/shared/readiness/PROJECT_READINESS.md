# Project Readiness Gate

## Instructions

Before implementing any use case (`UC-XXX`), validate that the project's cross-cutting
infrastructure is in place. Check every item below. If any item fails, report all failures
to the user and **stop** — do not begin implementation.

This gate ensures that error handling, authentication, authorization, security headers, and
environment configuration exist before feature code is written. Without these, use case
implementations will lack consistent error handling, auth checks, and security protections.

This is a **React SPA + ASP.NET Core** stack: a .NET API (controllers/minimal APIs, EF Core,
the middleware pipeline in `Program.cs`) plus a separate React single-page app that calls the
API over HTTP. Both halves must be ready.

**This gate does NOT apply to:**
- Technical tasks (`TT-XXX`) — these may be the tasks that set up the infrastructure itself
- Bug fixes (`BUG-XXX`) — these fix existing code and should not be blocked

## How to Check

Use the context7 MCP server to look up the current ASP.NET Core documentation for the
middleware pipeline ordering, authentication/authorization, exception-handler middleware, and
`ILogger`/logging configuration. The correct APIs depend on the project's installed .NET
version (read the `.csproj` `<TargetFramework>`). Do not assume fixed APIs — let the
documentation for the installed version guide what to look for.

## Checklist

### Request Pipeline (auth, routing, security headers) — API

- [ ] **Middleware pipeline configured** — `Program.cs` (or `Startup.cs`) wires the request pipeline in a sensible order (routing → CORS → authentication → authorization → endpoints)
- [ ] **Authentication configured** — an authentication scheme is registered (e.g. JWT bearer, cookie, or Google OAuth) via `AddAuthentication(...)`
- [ ] **Authorization configured** — `AddAuthorization(...)` is present and endpoints are protected with `[Authorize]` / policies where the requirements demand it
- [ ] **Security headers** — security response headers (CSP, HSTS, X-Content-Type-Options, etc.) are applied, via middleware or a package
- [ ] **CORS** — a CORS policy permitting the React SPA origin is configured (the SPA is a separate origin)

### Error Handling & Observability — API

- [ ] **Exception-handler middleware** — global exception handling is configured (`UseExceptionHandler`, an `IExceptionHandler`, or a custom middleware) so unhandled errors return a consistent problem response
- [ ] **Structured logging** — logging is configured (`ILogger<T>` via the built-in provider or Serilog/etc.); errors are logged with structured context, not swallowed

### Environment Configuration

- [ ] **Settings files** — `appsettings.json` and at least one environment overlay (`appsettings.Development.json` / `appsettings.Test.json`) exist
- [ ] **Secrets** — secrets (connection strings, auth client secrets, signing keys) are supplied via user-secrets, environment variables, or a secret store — **not** committed in `appsettings.json`

### Database

- [ ] **EF Core DbContext** — a `DbContext` exists and is registered in DI (`AddDbContext<...>`)
- [ ] **Migrations applied** — a `Migrations/` folder exists with at least one migration

### Frontend (React SPA)

- [ ] **API client configured** — a central HTTP client (e.g. axios instance) with the API base URL and auth-token handling exists, rather than ad-hoc `fetch` calls scattered across components
- [ ] **App shell & routing** — the SPA has a router (e.g. react-router) with a route layout and an auth-guarded route pattern

### Internationalization (Conditional)

**Detection:** Scan `docs/requirements.md` for mentions of internationalization, localization,
multi-language, i18n, or supported locales.

If the requirements do **not** mention i18n, skip this section entirely.

If the requirements **do** require i18n, verify that a localization approach exists on both
halves — API (`IStringLocalizer` / `Microsoft.Extensions.Localization` or equivalent) and SPA
(an i18n library such as i18next or react-intl, with locale message catalogs). If it is
required but absent, report it as a failure.

> Note: this plugin does not yet ship a `/setup-i18n` skill for this stack (planned). Until it
> lands, i18n infrastructure is set up manually. Setting it up **before** implementation avoids
> retrofitting every component and message later.

**Why this is checked early:** Adding i18n after features are built requires retrofitting
every page, component, and user-facing message. Setting it up before implementation ensures
all feature code uses translation keys from the start, avoiding a costly migration later.

## On Failure

Report which checks failed and guide the user:

| Missing Infrastructure                 | How to resolve                                                    |
|----------------------------------------|-------------------------------------------------------------------|
| EF Core `DbContext` / migrations       | Run `/ef-migration`                                               |
| Middleware pipeline / auth / headers   | Set up manually (a `/setup-web-middleware` skill is planned)      |
| Exception handling / structured logging| Set up manually (a `/setup-web-middleware` skill is planned)      |
| Settings files / secrets               | Set up manually (a `/setup-env-profiles` skill is planned)        |
| SPA API client / routing shell         | Set up manually                                                   |
| Internationalization                   | Set up manually (a `/setup-i18n` skill is planned)                |

Example failure message:

```
PROJECT READINESS FAILED — cannot implement UC-XXX

Missing infrastructure:
- ✗ No global exception-handler middleware found in Program.cs
- ✗ No CORS policy for the SPA origin
- ✗ appsettings.Development.json not found

Resolve first:
1. EF Core DbContext + migrations → run /ef-migration
2. Middleware pipeline, CORS, exception handling → configure in Program.cs
   (a /setup-web-middleware skill for this stack is planned but not yet available)
3. Environment settings → add appsettings.Development.json + user-secrets

After resolving these, re-run /implement UC-XXX.
```
