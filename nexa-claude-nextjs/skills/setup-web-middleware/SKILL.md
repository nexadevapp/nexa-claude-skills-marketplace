---
name: setup-web-middleware
description: >
  Builds the Next.js request interception layer with authentication, authorization, security
  headers, error tracking, and request context enrichment. Run before implementing use cases
  so that feature code can rely on cross-cutting infrastructure. Use when the user asks to
  "set up middleware", "add auth middleware", "build the middleware layer",
  "add security headers", "protect my routes", "add login redirect", "secure my
  API routes", "set up route guards", or mentions middleware, authentication guard,
  route protection, or RBAC middleware.
---

# Build Web Middleware

## Instructions

Build the Next.js request interception and cross-cutting infrastructure for the project.
This skill produces the infrastructure that use case implementations depend on:
authentication, authorization, security headers, structured error logging, and server
error tracking.

Run this skill **after** the entity model and Prisma migration exist (so user/role entities
are available) and **before** implementing use cases.

## Step 0: Consult Next.js Documentation

**Before writing any code**, use the context7 MCP server to look up the current Next.js
documentation for the project's installed version (read `package.json` to determine the
version). Query for:

1. **Request interception file convention** — the correct file name, export name, runtime,
   and configuration format for the request interception entry point (historically
   `middleware.ts`, but this may change across versions)
2. **Runtime constraints** — which runtime the request interception layer runs in and what
   APIs are available or restricted (e.g. Edge Runtime vs Node.js, Prisma availability,
   native module support)
3. **Instrumentation and error tracking** — the correct file convention and exports for
   global server error tracking (e.g. `instrumentation.ts` with `onRequestError`)
4. **Matcher/config format** — how to configure which routes the interception layer applies to

Store these findings and use them throughout the remaining steps. Every file name, export
name, runtime constraint, and API choice in the steps below must align with what the
documentation says for the installed version — not with hardcoded assumptions.

## DO NOT

- Overwrite an existing request interception file without showing the user what will change and asking for confirmation
- Hard-code secrets, tokens, or credentials (use environment variables)
- Install authentication libraries without user confirmation (e.g. next-auth, lucia, clerk) — ask the user which auth approach to use
- Use libraries incompatible with the runtime determined in Step 0
- Import Prisma Client from the request interception entry point if the runtime does not support it
- Add i18n routing unless the requirements explicitly mention internationalization
- Add rate limiting logic inside the request interception layer (use a dedicated service or external provider)
- Create feature-specific logic in the interception layer — keep it generic and cross-cutting
- Skip reading the entity model — the layer must align with the project's user/role structure
- Set security headers in both the interception entry point and `next.config.js` — pick one location to avoid duplication and conflicts
- Hardcode file names or runtime constraints without checking the documentation first

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Prerequisites

The following must exist before running this skill:

- `docs/requirements.md` (from `/requirements`) — to identify security and auth NFRs
- `docs/entity_model.md` (from `/entity-model`) — to understand user/role entities
- `prisma/schema.prisma` (from `/prisma-migration`) — to confirm user/role models exist

If any prerequisite is missing, stop and tell the user which `/command` to run first.

## Workflow

### Step 1: Gather Context

1. Read `docs/requirements.md` and extract:
   - Authentication requirements (login, session management, token type)
   - Authorization requirements (roles, permissions, RBAC rules)
   - Security NFRs (CSRF, headers, HTTPS enforcement)
   - Any explicit middleware-related requirements
2. Read `docs/entity_model.md` and identify:
   - The User entity (or equivalent) and its fields
   - Role/Permission entities and their relationship to User
   - Session or Token entities if defined
3. Read `prisma/schema.prisma` and verify the user/role models exist
4. Read `package.json` and check for existing auth libraries (`next-auth`, `lucia`, `@clerk/nextjs`, `@supabase/ssr`, etc.)

### Step 2: Retrofit Detection

Check whether the project already has implemented features by scanning for existing pages,
API routes, and server actions. This step determines whether the skill runs in **greenfield
mode** (no existing features) or **retrofit mode** (existing code that will be affected).

#### 2a. Scan for Existing Code

Search the codebase for:

- **Pages** — `app/**/page.tsx` files (excluding `app/page.tsx` if it's just a landing page)
- **API routes** — `app/api/**/route.ts` files
- **Server actions** — files containing `"use server"` in `app/actions/` or colocated with pages
- **Existing request interception** — check if a request interception file already exists at the project root (use the file name determined in Step 0)
- **Ad-hoc auth checks** — grep for patterns like `getServerSession`, `getSession`, `auth()`, `cookies().get`, `headers().get('authorization')`, or manual token validation in existing code

#### 2b. If Existing Request Interception Found

If a request interception file already exists, show the user its current content and ask
whether to **Extend** (keep existing logic, add auth/security layers around it), **Replace**
(discard and build from scratch), or **Abort** (let the user review first). Wait for the
user to choose before proceeding. See [REFERENCE.md](REFERENCE.md#step-2-retrofit-prompts)
for the exact prompt text.

#### 2c. If Existing Features Found (Retrofit Mode)

If pages, API routes, or server actions exist, activate **retrofit mode**. Build an
**impact analysis** — for each route protection rule (from Step 3), map it against the
existing routes and classify each file as Breaking, Review, or No impact — then present the
table to the user with options to Proceed, Adjust rules, or Abort. Wait for the user to
choose before proceeding. See
[REFERENCE.md](REFERENCE.md#step-2-retrofit-prompts) for the impact-analysis table format
and exact prompt text.

#### 2d. Ad-hoc Auth Consolidation Plan

If existing code contains ad-hoc auth checks (from 2a), list each file, its current auth
pattern, and a recommendation (Remove — interception layer handles it, or Keep — server
actions invoked directly from server components bypass the interception layer and must keep
their explicit auth check). See [REFERENCE.md](REFERENCE.md#step-2-retrofit-prompts) for the
table format and the exact prompt text.

**Important:** Server actions called via `fetch` or form submission go through the
interception layer, but server actions called directly from server components do not.
For these, the explicit auth check in the action itself must be **kept**, not removed.
Flag this distinction clearly in the consolidation plan.

#### 2e. Generate Migration Checklist

If in retrofit mode, create a technical task following the standard `TT-XXX` naming
convention: read `docs/technical_tasks/` to determine the next available `TT-XXX` ID, then
create `docs/technical_tasks/TT-XXX-middleware-retrofit.md` from
`nexa-claude-core/skills/technical-task/templates/technical-task.md`. See
[REFERENCE.md](REFERENCE.md#step-2e-migration-checklist-task-fields) for the exact field
values (Task Name, Category, Goal, Status, Acceptance Criteria grouping, Affected Areas).

This checklist becomes the work plan for adapting existing code after the interception layer is in place.

**Do not apply the migration changes in this skill.** The checklist is implemented via
`/implement TT-XXX-middleware-retrofit` (using the assigned ID) as a follow-up step, so each
change can be reviewed individually.

### Step 3: Confirm Auth Strategy with User

If an auth library is already installed in `package.json`, lead with it:

> **I found `<library>` in your dependencies. Should I build the interception layer around it?**
>
> If not, choose an alternative:

If no auth library is installed, present options. Use the context7 MCP server to check
which auth libraries are compatible with the runtime determined in Step 0, then present:

> **Authentication strategy — choose one:**
>
> [list options compatible with the runtime, e.g. session-based, JWT, external provider]

Wait for the user to choose before proceeding.

### Step 4: Define Route Protection Rules

Ask the user to confirm or adjust the default route protection rules:

> **Route protection rules (adjust as needed):**
>
> | Pattern             | Rule           |
> |---------------------|----------------|
> | `/`                 | Public         |
> | `/login`, `/signup` | Public (redirect if authenticated) |
> | `/api/auth/**`      | Public         |
> | `/dashboard/**`     | Authenticated  |
> | `/admin/**`         | Authenticated + Admin role |
> | `/api/**`           | Authenticated  |
>
> Should I proceed with these defaults, or do you want to customize them?

Incorporate the user's adjustments.

### Step 5: Build the Infrastructure

Create the files below. For every file, use the conventions determined in Step 0 (file
names, export names, runtime APIs, matcher format). Consult the context7 MCP server again
if you need to clarify any API or convention.

#### 5a. Request Interception Entry Point (project root)

Create the entry point file using the correct file name and export name from Step 0. It must:

- Export the entry function and configuration using the convention from the docs
- Use the matcher/config to exclude static assets and internal Next.js routes
- Wrap the entire function body in a try/catch. On unexpected errors, log the error with full context and **fail closed** (redirect to login rather than letting the request through)
- Follow this composition pattern:
  1. Check if the route is public — if so, log at debug level, apply security headers and return
  2. Validate the session/token (respect runtime constraints — if DB calls are not available, validate statelessly)
  3. If unauthenticated on a protected route — log a warning with the path and redirect to login
  4. If authenticated on an auth route (login/signup) — log at debug level and redirect to dashboard
  5. If route requires a specific role and user lacks it — log a warning with the path, user ID, and required vs. actual roles, then return 403 or redirect
  6. Apply security headers to the response
  7. Return the response

#### 5b. `lib/auth/middleware.ts`

Auth-specific helpers (must respect the runtime constraints from Step 0):

- `getSessionFromRequest(request)` — extract and validate the session/token from the request cookie or Authorization header. Use libraries compatible with the runtime. Must never throw — catch verification errors internally, log them, and return `null`
- `isAuthenticated(session)` — check if the session is valid and not expired
- `hasRole(session, role)` — check if the user has the required role

#### 5c. `lib/auth/constants.ts`

Route and auth constants:

- `PUBLIC_ROUTES` — array of public route patterns
- `AUTH_ROUTES` — array of auth-related routes (login, signup) that redirect when authenticated
- `ROLE_PROTECTED_ROUTES` — map of route patterns to required roles, supporting multiple roles per route
- `DEFAULT_LOGIN_REDIRECT` — where to redirect after login (e.g. `/dashboard`)
- `LOGIN_PAGE` — the login page path

#### 5d. `lib/auth/headers.ts`

Security headers utility. Set headers **only** in the interception entry point — not in
`next.config.js` — to avoid duplication and conflicts:

- `securityHeaders()` — returns a `Headers` object with:
  - `Content-Security-Policy` — start with a restrictive baseline and add a comment noting it should be tuned per project
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-DNS-Prefetch-Control: off`
  - `Permissions-Policy` with sensible defaults (e.g. `camera=(), microphone=(), geolocation=()`)
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (production only — check `process.env.NODE_ENV`)

#### 5e. `lib/auth/logger.ts`

Structured logger (must respect the runtime constraints from Step 0 — use only APIs
available in the determined runtime):

- Create a logger object with `debug`, `warn`, and `error` methods
- Every log message must be a **structured JSON string** with these fields:
  - `timestamp` — ISO 8601
  - `level` — `DEBUG`, `WARN`, or `ERROR`
  - `source` — identifies this as the request interception layer
  - `path` — the request path
  - `method` — the HTTP method
  - `message` — human-readable description of what happened
  - Additional context fields depending on the event (see below)
- `debug` level is only emitted when `process.env.NODE_ENV !== 'production'` to avoid noise
- Define explicit log messages for each decision point — see
  [REFERENCE.md](REFERENCE.md#step-5e-log-event-table) for the full table of events, levels,
  and additional fields to include

**Security rule:** Never log token values, session cookies, secrets, or full Authorization
headers. Log user IDs and error messages only.

#### 5f. Instrumentation / Server Error Tracking

Use the context7 MCP server to look up the correct file convention and exports for global
server error tracking in the installed Next.js version. Create the instrumentation file at
the project root with an error tracking export that:

- Captures all server-side errors (render errors, route handler errors, server action errors)
- Logs errors as structured JSON with: error message, request path, HTTP method, route type, and error digest
- Is extensible — includes a comment showing where to send errors to an external observability provider (e.g. Sentry, Datadog)

### Step 6: Install Dependencies

Install any required packages for the chosen auth strategy. Always ask the user for
confirmation before installing. Use the context7 MCP server to verify package compatibility
with the runtime determined in Step 0.

### Step 7: Update Environment Variables

Check existing `.env*` files (`.env.local`, `.env.development`, `.env.production`, and
`.env.example` if present) and add any missing auth-related variables:

- `AUTH_SECRET` / `NEXTAUTH_SECRET` (for session signing)
- `AUTH_URL` / `NEXTAUTH_URL` (for callback URLs)
- Provider-specific variables (OAuth client ID/secret, etc.)

Comment out variables that need user-provided values with a `# TODO:` prefix.

If `.env.example` exists, add the new variables there as well (without values) so other
developers know which variables are required.

### Step 8: Write Unit Tests

Create unit tests for the modules. Focus on pure functions with clear
inputs/outputs — these give real regression value without maintenance burden.

Place test files colocated with the source:

| Source File              | Test File                                |
|--------------------------|------------------------------------------|
| `lib/auth/headers.ts`    | `lib/auth/__tests__/headers.test.ts`    |
| `lib/auth/logger.ts`     | `lib/auth/__tests__/logger.test.ts`     |
| `lib/auth/middleware.ts`  | `lib/auth/__tests__/middleware.test.ts` |

**Do not** create a test file for `constants.ts` — it contains static data, not logic.
Testing that an array contains specific values just creates a test that breaks on every
intentional change without catching actual bugs.

**Do not** create a unit test for the root request interception entry point — it relies
heavily on framework request/response objects that are complex to mock correctly, making
these tests brittle. The routing logic is more reliably validated by Playwright e2e tests.

Cover `headers.test.ts` (all required security headers present, HSTS only in production),
`logger.test.ts` (structured JSON fields, debug suppressed in production, console method
routing), and `middleware.test.ts` (session validation: valid/missing/expired/invalid-signature
tokens, `isAuthenticated`, `hasRole`) — see
[REFERENCE.md](REFERENCE.md#step-8-unit-test-assertions) for the full per-file assertion lists.

### Step 9: Verify

1. Run `npx next build` to verify everything compiles and is compatible with the runtime
2. Verify the matcher/config excludes `_next/static`, `_next/image`, and static file extensions
3. Verify that the entry point exports are correct (use the convention from Step 0)
4. Verify that no Prisma Client imports exist in the entry point or any file it imports, if the runtime does not support it
5. Run all existing tests to ensure nothing is broken:
   - **Unit tests** — run `npx vitest run` (includes the new unit tests from Step 8)
   - **Integration tests** — if integration test files exist (e.g. `**/*.integration.test.ts`), run them
   - **End-to-end tests** — if Playwright is configured (`playwright.config.ts` exists), run `npx playwright test`
   - If any test fails, fix the issue before proceeding. In retrofit mode, test failures likely
     indicate routes that need the auth setup from the migration checklist — note these in the
     summary but do not suppress or skip the tests
6. Create a minimal smoke test: describe to the user how to manually verify:
   - Visit a protected route (e.g. `/dashboard`) without being logged in → should redirect to login
   - Visit a public route (e.g. `/`) → should load normally
   - Check response headers in browser DevTools → security headers should be present

### Step 10: Update CLAUDE.md

Append a `## Web Middleware` section to the target project's `CLAUDE.md` so that future
sessions know the auth strategy, route protection rules, and middleware architecture.

1. If `CLAUDE.md` does not exist, create it
2. If a `## Web Middleware` section already exists (check for `<!-- NEXA_WEB_MIDDLEWARE_CONFIGURED -->`),
   ask the user whether to overwrite or skip
3. Append the section from [REFERENCE.md](REFERENCE.md#step-10-claudemd-section-template)
   (fill in the actual values from the setup)

Do not remove or modify any other content in `CLAUDE.md`.

### Step 11: Summary

Present a summary of what was created, using the template in
[REFERENCE.md](REFERENCE.md#step-11-summary-template): Next.js version and conventions, auth
strategy, files created/updated, route protection, environment variables, error handling and
observability notes, test results, what this enables for feature implementation, retrofit
status (if applicable), and next steps.
