---
name: build-web-middleware
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

If a request interception file already exists, show the user its current content and ask:

> **An existing request interception file was found. Choose how to proceed:**
>
> 1. **Extend** — keep existing logic and add auth/security layers around it
> 2. **Replace** — discard the current file and build from scratch
> 3. **Abort** — stop and let me review the existing file first

Wait for the user to choose before proceeding.

#### 2c. If Existing Features Found (Retrofit Mode)

If pages, API routes, or server actions exist, activate **retrofit mode**.

**Impact analysis** — for each route protection rule (from Step 3), map it against the
existing routes and classify each file:

| File                        | Current Auth | Will Become     | Impact     |
|-----------------------------|-------------|-----------------|------------|
| `app/dashboard/page.tsx`    | None        | Authenticated   | **Breaking** — will redirect to login |
| `app/api/users/route.ts`   | Manual check | Authenticated  | Review — has ad-hoc auth, may conflict |
| `app/api/health/route.ts`  | None        | Authenticated   | **Breaking** — health check will require auth |
| `app/about/page.tsx`       | None        | Public          | No impact  |

Present this table to the user and ask:

> **Retrofit impact analysis:**
>
> The following existing routes will be affected:
>
> [impact table]
>
> **Breaking changes** require updates — these routes currently work without auth
> and will start redirecting or returning 403 after the interception layer is applied.
>
> **Review items** have existing ad-hoc auth that may conflict or duplicate the
> new logic.
>
> Options:
> 1. **Proceed** — I'll adjust the route protection rules to minimize breakage and
>    generate a migration checklist for the remaining changes
> 2. **Adjust rules** — let me customize which routes stay public before proceeding
> 3. **Abort** — let me review the existing code first

Wait for the user to choose before proceeding.

#### 2d. Ad-hoc Auth Consolidation Plan

If existing code contains ad-hoc auth checks (from 2a), list each file and its current
auth pattern:

> **Existing ad-hoc auth found in these files:**
>
> | File                       | Current Pattern                          | Recommendation          |
> |----------------------------|------------------------------------------|-------------------------|
> | `app/api/users/route.ts`   | `getServerSession()` + manual role check | Remove — interception layer handles it |
> | `app/actions/create-post.ts` | `auth()` guard at top of action        | Keep — server actions need explicit auth since the interception layer only covers the request |
> | `app/dashboard/page.tsx`   | `redirect()` if no session               | Remove — interception layer redirects |
>
> After the interception layer is built, I will update these files as part of the migration checklist.

**Important:** Server actions called via `fetch` or form submission go through the
interception layer, but server actions called directly from server components do not.
For these, the explicit auth check in the action itself must be **kept**, not removed.
Flag this distinction clearly in the consolidation plan.

#### 2e. Generate Migration Checklist

If in retrofit mode, create a technical task following the standard `TT-XXX` naming convention:

1. Read existing files in `docs/technical_tasks/` to determine the next available `TT-XXX` ID (zero-padded, 3 digits — e.g. if `TT-003.md` is the highest, the next is `TT-004`)
2. Create `docs/technical_tasks/TT-XXX-middleware-retrofit.md` using the template from `nexa-claude-core/skills/technical-task/templates/technical-task.md` with:
   - **Task ID:** `TT-XXX` (the assigned numeric ID)
   - **Task Name:** Middleware Retrofit — Consolidate Ad-hoc Auth
   - **Category:** Cleanup
   - **Goal:** Adapt existing routes and server actions to use the new auth layer, removing redundant ad-hoc auth checks and updating tests
   - **Status:** Approved
   - **Acceptance Criteria:** one checklist item per file that needs updating, grouped by change type:
     - **Remove redundant auth** — files where the interception layer now handles what the code did manually
     - **Keep explicit auth** — server actions that need their own auth check
     - **Update tests** — test files that need auth tokens/sessions added to their setup
     - **Review conflicts** — files with auth logic that may conflict with the new behavior
   - **Affected Areas:** every file identified in the retrofit analysis
   - **Dependencies:** None

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
- Define explicit log messages for each decision point:

| Event                     | Level   | Additional Fields                                      |
|---------------------------|---------|--------------------------------------------------------|
| Public route — allowed    | `DEBUG` | —                                                      |
| Auth route — redirected   | `DEBUG` | `userId`, `redirectTo`                                 |
| Token missing             | `WARN`  | `redirectTo`                                           |
| Token expired             | `WARN`  | `userId` (if decodable), `expiredAt`                   |
| Token malformed           | `WARN`  | `error` (the parse error message, not the token value) |
| Token signature invalid   | `ERROR` | `error`                                                |
| AUTH_SECRET missing       | `ERROR` | —                                                      |
| Role check failed         | `WARN`  | `userId`, `requiredRoles`, `actualRoles`, `redirectTo` |
| Unexpected error          | `ERROR` | `error`, `stack`                                       |
| Authenticated — allowed   | `DEBUG` | `userId`                                               |

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

#### 8a. `headers.test.ts` — Security Headers

Test the `securityHeaders()` function:

- Returns all required security headers (`Content-Security-Policy`, `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `X-DNS-Prefetch-Control`, `Permissions-Policy`)
- `Strict-Transport-Security` is present only when `NODE_ENV=production`
- `Strict-Transport-Security` is absent when `NODE_ENV=development`
- Header values match the expected defaults

#### 8b. `logger.test.ts` — Structured Logger

Test the logger object:

- `debug` emits a JSON string to `console.debug` with correct fields (`timestamp`, `level`,
  `source`, `path`, `method`, `message`)
- `warn` and `error` emit to `console.warn` and `console.error` respectively
- `debug` is suppressed when `NODE_ENV=production`
- `debug` is emitted when `NODE_ENV` is not `production`
- Additional context fields (e.g. `userId`, `redirectTo`) are included in the output
- Mock `console` methods with `vi.spyOn` and parse the logged JSON to assert field values

#### 8c. `middleware.test.ts` (lib/auth) — Session Helpers

Test the auth helper functions. The test setup depends on the auth strategy chosen in Step 3.
Use the context7 MCP server to look up the correct testing approach for the chosen auth
library and runtime.

Regardless of strategy, test these behaviors:

- `getSessionFromRequest` returns a valid session when a valid token/cookie is present
- `getSessionFromRequest` returns `null` when no token is present
- `getSessionFromRequest` returns `null` when the token is expired
- `getSessionFromRequest` returns `null` when the token signature is invalid
- `getSessionFromRequest` never throws (returns `null` on any error)
- `isAuthenticated` returns `true` for a valid, non-expired session
- `isAuthenticated` returns `false` for `null` or expired sessions
- `hasRole` returns `true` when the session contains the required role
- `hasRole` returns `false` when the session lacks the required role

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

### Step 10: Summary

Present a summary of what was created:

```
## Web Middleware Created

### Next.js Version & Conventions
- Next.js version: <version>
- Request interception file: <file name> (runtime: <runtime>)
- Instrumentation file: <file name>

### Auth Strategy
<chosen strategy>

### Files Created/Updated
| File                                     | Purpose                                |
|------------------------------------------|----------------------------------------|
| <entry point file>                       | Request interception entry point       |
| <instrumentation file>                   | Global server error tracking           |
| lib/auth/middleware.ts                   | Session validation helpers             |
| lib/auth/constants.ts                    | Route rules and auth constants         |
| lib/auth/headers.ts                      | Security headers (including CSP)       |
| lib/auth/logger.ts                       | Structured logger                      |
| lib/auth/__tests__/headers.test.ts       | Unit tests for security headers        |
| lib/auth/__tests__/logger.test.ts        | Unit tests for structured logger       |
| lib/auth/__tests__/middleware.test.ts    | Unit tests for session helpers         |

### Route Protection
| Pattern       | Rule                              |
|---------------|-----------------------------------|
| ...           | ...                               |

### Environment Variables
| Variable      | Status                            |
|---------------|-----------------------------------|
| ...           | Added / Already exists / TODO     |

### Error Handling & Observability
- Request interception fails closed — unexpected errors redirect to login, never allow through
- All auth failures produce structured JSON logs with path, method, and error context
- Debug-level logs are suppressed in production
- Server errors are captured globally via instrumentation and logged with request context

### Test Results
- Unit tests: X passed, Y failed
- Integration tests: X passed, Y failed (or N/A if none exist)
- End-to-end tests: X passed, Y failed (or N/A if Playwright not configured)
- [If any failures, list them and explain whether they are pre-existing or caused by the changes]

### What This Enables for Feature Implementation
- `getSessionFromRequest(request)` is available in API routes and server actions
- Protected routes automatically redirect to login
- Role-based routes enforce access checks
- Security headers (including CSP) are applied to all responses
- Structured logs make auth issues debuggable via `source` filter
- Server errors are tracked globally with request context
- The `/implement` skill can assume auth infrastructure exists

### Retrofit (if applicable)
- Mode: Greenfield / Retrofit
- Existing routes affected: N
- Breaking changes: N files
- Ad-hoc auth to consolidate: N files
- Migration checklist: docs/technical_tasks/TT-XXX-middleware-retrofit.md

### Next Steps
- Implement the auth API routes (login, signup, session endpoints)
- Implement the login/signup pages as a use case with `/implement`
- If in retrofit mode: run `/implement TT-XXX-middleware-retrofit` to adapt existing code
- Configure OAuth providers and fill in `# TODO:` env vars (if applicable)
- Tune the Content-Security-Policy header for your project's specific needs
- Run `/implement` for your next use case
```
