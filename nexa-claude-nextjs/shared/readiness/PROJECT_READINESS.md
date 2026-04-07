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

Use the context7 MCP server to look up the current Next.js documentation for middleware/proxy
file conventions, instrumentation, and error handling. The correct file names, exports, and
runtime constraints depend on the project's installed Next.js version (read `package.json`).
Do not assume fixed file names — let the documentation for the installed version guide what
to look for.

## Checklist

### Request Interception Layer (auth, routing, security headers)

- [ ] **Entry point exists** — the project has a request interception file at the root (consult Next.js docs for the correct file convention for the installed version)
- [ ] **Auth helpers** — session validation helpers exist (e.g. in `lib/auth/`)
- [ ] **Route protection rules** — public routes, auth routes, and role-protected routes are defined
- [ ] **Security headers** — a security headers utility exists and is applied to responses

### Error Handling & Observability

- [ ] **Structured logger** — a structured logging utility exists for the request interception layer
- [ ] **Server error tracking** — the project has instrumentation for global server error tracking (consult Next.js docs for the correct file convention and exports for the installed version)

### Environment Configuration

- [ ] **Environment files** — at least one `.env*` file exists (`.env.local`, `.env.development`, or `.env`)
- [ ] **Auth secret configured** — an auth secret variable is defined in the environment file (`AUTH_SECRET`, `NEXTAUTH_SECRET`, or equivalent)

### Database

- [ ] **Prisma schema** — `prisma/schema.prisma` exists
- [ ] **Migrations applied** — `prisma/migrations/` directory exists and contains at least one migration

### Internationalization (Conditional)

**This section applies only when `docs/requirements.md` mentions internationalization,
localization, multi-language, i18n, or supported locales.** If the requirements do not
mention any of these, skip this section entirely.

When internationalization is required:

- [ ] **i18n library installed** — `next-intl` (or equivalent) is listed in `package.json` dependencies
- [ ] **Translation files exist** — a `messages/` directory exists with at least one locale JSON file
- [ ] **Locale configuration** — `i18n/config.ts` (or equivalent) exists and exports `locales`, `defaultLocale`
- [ ] **Routing configuration** — `i18n/routing.ts` (or equivalent) exists with locale-aware routing
- [ ] **Locale layout segment** — `app/[locale]/layout.tsx` exists with locale provider and `lang` attribute
- [ ] **Middleware locale detection** — the request interception entry point includes locale detection logic

**Why this is checked early:** Adding i18n after features are built requires retrofitting
every page, component, and user-facing message. Setting it up before implementation ensures
all feature code uses translation keys from the start, avoiding a costly migration later.

## On Failure

Report which checks failed and guide the user to the correct skill:

| Missing Infrastructure                | Run This First         |
|---------------------------------------|------------------------|
| Request interception / auth / headers | `/setup-web-middleware` |
| Error handling / instrumentation      | `/setup-web-middleware` |
| Environment files                     | `/setup-env-profiles`  |
| Prisma schema or migrations           | `/prisma-migration`    |
| Internationalization infrastructure   | `/setup-i18n`          |

Example failure message:

```
PROJECT READINESS FAILED — cannot implement UC-XXX

Missing infrastructure:
- ✗ No request interception entry point found at project root
- ✗ No server error tracking / instrumentation found
- ✗ No .env* file found
- ✗ Internationalization required by requirements but not configured

Run these skills first:
1. /setup-web-middleware — sets up auth, security headers, structured error logging, and instrumentation
2. /setup-env-profiles — creates environment configuration files
3. /setup-i18n — sets up internationalization infrastructure (locales, translations, routing)

After running these, re-run /implement UC-XXX.
```
