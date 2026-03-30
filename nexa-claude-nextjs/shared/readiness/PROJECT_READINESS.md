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

## On Failure

Report which checks failed and guide the user to the correct skill:

| Missing Infrastructure                | Run This First         |
|---------------------------------------|------------------------|
| Request interception / auth / headers | `/build-web-middleware` |
| Error handling / instrumentation      | `/build-web-middleware` |
| Environment files                     | `/setup-env-profiles`  |
| Prisma schema or migrations           | `/prisma-migration`    |

Example failure message:

```
PROJECT READINESS FAILED — cannot implement UC-XXX

Missing infrastructure:
- ✗ No request interception entry point found at project root
- ✗ No server error tracking / instrumentation found
- ✗ No .env* file found

Run these skills first:
1. /build-web-middleware — sets up auth, security headers, structured error logging, and instrumentation
2. /setup-env-profiles — creates environment configuration files

After running these, re-run /implement UC-XXX.
```
