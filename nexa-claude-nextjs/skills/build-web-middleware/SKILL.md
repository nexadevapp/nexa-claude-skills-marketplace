---
name: build-web-middleware
description: >
  Builds the Next.js middleware layer with authentication, authorization, security
  headers, and request context enrichment. Run before implementing use cases so that
  feature code can rely on cross-cutting infrastructure. Use when the user asks to
  "set up middleware", "add auth middleware", "build the middleware layer",
  "add security headers", "protect my routes", "add login redirect", "secure my
  API routes", "set up route guards", or mentions middleware, authentication guard,
  route protection, or RBAC middleware.
---

# Build Web Middleware

## Instructions

Build the Next.js middleware layer for the project. This skill produces the cross-cutting
infrastructure that use case implementations depend on: authentication, authorization,
security headers, and request context enrichment.

Run this skill **after** the entity model and Prisma migration exist (so user/role entities
are available) and **before** implementing use cases.

If a documentation MCP server (e.g. context7) is available, use it to look up Next.js
middleware docs. Otherwise, rely on training knowledge and the project's installed
Next.js version.

## Edge Runtime Constraints

Next.js middleware runs in the **Edge Runtime**. This imposes hard constraints:

- **No Node.js APIs** — `fs`, `crypto` (full), native modules, and `node:*` imports are unavailable
- **No Prisma Client** — you cannot import or call Prisma from `middleware.ts`. Session validation must be **stateless** (e.g. verify a JWT signature) or delegated to an API route
- **Edge-compatible libraries only** — use `jose` for JWT (not `jsonwebtoken`), use Web Crypto API for hashing
- **No heavy dependencies** — middleware must stay lightweight; large libraries will slow every request

If the chosen auth strategy requires a database lookup to validate sessions (e.g. Lucia with
DB sessions), the middleware must verify a signed cookie/token statelessly and defer full
session hydration to server components or API routes.

## DO NOT

- Overwrite an existing `middleware.ts` without showing the user what will change and asking for confirmation
- Hard-code secrets, tokens, or credentials (use environment variables)
- Install authentication libraries without user confirmation (e.g. next-auth, lucia, clerk) — ask the user which auth approach to use
- Use Edge-incompatible libraries in middleware (`jsonwebtoken`, `bcrypt`, Prisma Client, `node:*` imports)
- Import Prisma Client from `middleware.ts` — it will compile but fail at runtime in Edge
- Add i18n routing unless the requirements explicitly mention internationalization
- Add rate limiting logic inside the middleware itself (use a dedicated service or external provider)
- Create feature-specific logic in middleware — keep it generic and cross-cutting
- Skip reading the entity model — the middleware must align with the project's user/role structure
- Set security headers in both `middleware.ts` and `next.config.js` — pick one location to avoid duplication and conflicts

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
- **Existing middleware** — check if `middleware.ts` or `middleware.js` already exists at the project root
- **Ad-hoc auth checks** — grep for patterns like `getServerSession`, `getSession`, `auth()`, `cookies().get`, `headers().get('authorization')`, or manual token validation in existing code

#### 2b. If Existing Middleware Found

If `middleware.ts` already exists, show the user its current content and ask:

> **An existing `middleware.ts` was found. Choose how to proceed:**
>
> 1. **Extend** — keep existing logic and add auth/security layers around it
> 2. **Replace** — discard the current middleware and build from scratch
> 3. **Abort** — stop and let me review the existing middleware first

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
> The following existing routes will be affected by the middleware:
>
> [impact table]
>
> **Breaking changes** require updates — these routes currently work without auth
> and will start redirecting or returning 403 after middleware is applied.
>
> **Review items** have existing ad-hoc auth that may conflict or duplicate the
> middleware logic.
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
> | `app/api/users/route.ts`   | `getServerSession()` + manual role check | Remove — middleware handles it |
> | `app/actions/create-post.ts` | `auth()` guard at top of action        | Keep — server actions need explicit auth since middleware only covers the request |
> | `app/dashboard/page.tsx`   | `redirect()` if no session               | Remove — middleware redirects |
>
> After the middleware is built, I will update these files as part of the migration checklist.

**Important:** Server actions called via `fetch` or form submission go through middleware,
but server actions called directly from server components do not hit middleware. For these,
the explicit auth check in the action itself must be **kept**, not removed. Flag this
distinction clearly in the consolidation plan.

#### 2e. Generate Migration Checklist

If in retrofit mode, create a technical task following the standard `TT-XXX` naming convention:

1. Read existing files in `docs/technical_tasks/` to determine the next available `TT-XXX` ID (zero-padded, 3 digits — e.g. if `TT-003.md` is the highest, the next is `TT-004`)
2. Create `docs/technical_tasks/TT-XXX-middleware-retrofit.md` using the template from `nexa-claude-core/skills/technical-task/templates/technical-task.md` with:
   - **Task ID:** `TT-XXX` (the assigned numeric ID)
   - **Task Name:** Middleware Retrofit — Consolidate Ad-hoc Auth
   - **Category:** Cleanup
   - **Goal:** Adapt existing routes and server actions to use the new middleware auth layer, removing redundant ad-hoc auth checks and updating tests
   - **Status:** Approved
   - **Acceptance Criteria:** one checklist item per file that needs updating, grouped by change type:
     - **Remove redundant auth** — files where middleware now handles what the code did manually
     - **Keep explicit auth** — server actions that need their own auth check
     - **Update tests** — test files that need auth tokens/sessions added to their setup
     - **Review conflicts** — files with auth logic that may conflict with middleware behavior
   - **Affected Areas:** every file identified in the retrofit analysis
   - **Dependencies:** None

This checklist becomes the work plan for adapting existing code after the middleware is in place.

**Do not apply the migration changes in this skill.** The checklist is implemented via
`/implement TT-XXX-middleware-retrofit` (using the assigned ID) as a follow-up step, so each
change can be reviewed individually.

### Step 3: Confirm Auth Strategy with User

If an auth library is already installed in `package.json`, lead with it:

> **I found `<library>` in your dependencies. Should I build the middleware around it?**
>
> If not, choose an alternative:

If no auth library is installed, present all options:

> **Authentication strategy — choose one:**
>
> 1. **NextAuth.js (Auth.js)** — session-based, supports OAuth providers and credentials
> 2. **Lucia** — lightweight, session-based, full control over the auth flow
> 3. **Custom JWT** — stateless token-based auth with `jose` (Edge-compatible)
> 4. **External provider** — Clerk, Supabase Auth, AWS Cognito (middleware validates tokens)
> 5. **Other** — describe your preferred approach

Wait for the user to choose before proceeding.

### Step 3: Define Route Protection Rules

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

### Step 4: Build the Middleware

Create or update the following files:

#### 4a. `middleware.ts` (project root)

The middleware entry point. It must:

- Export a `middleware` function and a `config` with a `matcher` array
- Use the `matcher` to exclude static assets and internal Next.js routes:
  ```ts
  export const config = {
    matcher: [
      /*
       * Match all request paths except:
       * - _next/static (static files)
       * - _next/image (image optimization)
       * - favicon.ico, sitemap.xml, robots.txt
       * - Static file extensions (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico)
       */
      '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
  };
  ```
- Wrap the entire `middleware` function body in a try/catch. On unexpected errors, log the error with full context and **fail closed** (redirect to login rather than letting the request through)
- Follow this composition pattern in the `middleware` function:
  1. Check if the route is public — if so, log at debug level, apply security headers and return
  2. Validate the session/token statelessly (no DB calls)
  3. If unauthenticated on a protected route — log a warning with the path and redirect to login
  4. If authenticated on an auth route (login/signup) — log at debug level and redirect to dashboard
  5. If route requires a specific role and user lacks it — log a warning with the path, user ID, and required vs. actual roles, then return 403 or redirect
  6. Apply security headers to the response
  7. Return the response

#### 4b. `lib/auth/middleware.ts`

Auth-specific middleware helpers (must be Edge-compatible — no Prisma, no Node.js APIs):

- `getSessionFromRequest(request)` — extract and validate the session/token from the request cookie or Authorization header. For JWT strategies, verify the signature using `jose`. For session-based strategies, decode and verify the signed session cookie. Must never throw — catch verification errors internally, log them with `middlewareLogger.error()`, and return `null`
- `isAuthenticated(session)` — check if the session is valid and not expired
- `hasRole(session, role)` — check if the user has the required role

#### 4c. `lib/auth/constants.ts`

Route and auth constants:

- `PUBLIC_ROUTES` — array of public route patterns
- `AUTH_ROUTES` — array of auth-related routes (login, signup) that redirect when authenticated
- `ROLE_PROTECTED_ROUTES` — map of route patterns to required roles, supporting multiple roles per route:
  ```ts
  export const ROLE_PROTECTED_ROUTES: Record<string, { roles?: string[]; permissions?: string[] }> = {
    '/admin': { roles: ['ADMIN'] },
    '/admin/users': { roles: ['ADMIN', 'SUPER_ADMIN'] },
  };
  ```
- `DEFAULT_LOGIN_REDIRECT` — where to redirect after login (e.g. `/dashboard`)
- `LOGIN_PAGE` — the login page path

#### 4d. `lib/auth/headers.ts`

Security headers utility. Set headers **only** in middleware — not in `next.config.js` — to
avoid duplication and conflicts:

- `securityHeaders()` — returns a `Headers` object with:
  - `Content-Security-Policy` — start with a restrictive baseline (`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'`) and add a comment noting it should be tuned per project
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-DNS-Prefetch-Control: off`
  - `Permissions-Policy` with sensible defaults (e.g. `camera=(), microphone=(), geolocation=()`)
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (production only — check `process.env.NODE_ENV`)

#### 4e. `lib/auth/logger.ts`

Structured middleware logger (Edge-compatible — uses `console` only, no `fs` or external
logging libraries):

- Create a `middlewareLogger` object with `debug`, `warn`, and `error` methods
- Every log message must be a **structured JSON string** with these fields:
  - `timestamp` — ISO 8601
  - `level` — `DEBUG`, `WARN`, or `ERROR`
  - `source` — always `"middleware"`
  - `path` — the request path
  - `method` — the HTTP method
  - `message` — human-readable description of what happened
  - Additional context fields depending on the event (see below)
- `debug` level is only emitted when `process.env.NODE_ENV !== 'production'` to avoid noise
- Define explicit log messages for each middleware decision point:

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

Example output:
```json
{"timestamp":"2026-03-27T14:22:01.123Z","level":"WARN","source":"middleware","method":"GET","path":"/dashboard","message":"Token expired","userId":"usr_abc123","expiredAt":"2026-03-27T13:00:00.000Z"}
```

### Step 5: Install Dependencies

Install any required packages for the chosen auth strategy. Always ask the user for
confirmation before installing:

- **NextAuth.js**: `next-auth`
- **Lucia**: `lucia`, `@lucia-auth/adapter-prisma`
- **Custom JWT**: `jose` (Edge-compatible — do NOT install `jsonwebtoken`)
- **External provider**: provider-specific SDK

### Step 6: Update Environment Variables

Check existing `.env*` files (`.env.local`, `.env.development`, `.env.production`, and
`.env.example` if present) and add any missing auth-related variables:

- `AUTH_SECRET` / `NEXTAUTH_SECRET` (for session signing)
- `AUTH_URL` / `NEXTAUTH_URL` (for callback URLs)
- Provider-specific variables (OAuth client ID/secret, etc.)

Comment out variables that need user-provided values with a `# TODO:` prefix.

If `.env.example` exists, add the new variables there as well (without values) so other
developers know which variables are required.

### Step 7: Write Unit Tests

Create unit tests for the middleware modules. Focus on pure functions with clear
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

**Do not** create a unit test for the root `middleware.ts` function — it relies heavily on
`NextRequest`/`NextResponse` objects that are complex to mock correctly, making these tests
brittle. The middleware routing logic is more reliably validated by Playwright e2e tests.

#### 7a. `headers.test.ts` — Security Headers

Test the `securityHeaders()` function:

- Returns all required security headers (`Content-Security-Policy`, `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `X-DNS-Prefetch-Control`, `Permissions-Policy`)
- `Strict-Transport-Security` is present only when `NODE_ENV=production`
- `Strict-Transport-Security` is absent when `NODE_ENV=development`
- Header values match the expected defaults

#### 7b. `logger.test.ts` — Structured Logger

Test the `middlewareLogger` object:

- `debug` emits a JSON string to `console.debug` with correct fields (`timestamp`, `level`,
  `source`, `path`, `method`, `message`)
- `warn` and `error` emit to `console.warn` and `console.error` respectively
- `debug` is suppressed when `NODE_ENV=production`
- `debug` is emitted when `NODE_ENV` is not `production`
- Additional context fields (e.g. `userId`, `redirectTo`) are included in the output
- Mock `console` methods with `vi.spyOn` and parse the logged JSON to assert field values

#### 7c. `middleware.test.ts` (lib/auth) — Session Helpers

Test the auth helper functions. The test setup depends on the auth strategy chosen in Step 3:

- **Custom JWT (`jose`)** — use `jose` to create real test tokens (valid, expired, wrong-signature) signed with a test secret. Set `AUTH_SECRET` via `vi.stubEnv`
- **NextAuth.js** — mock `getToken()` from `next-auth/jwt` to return valid/null/expired payloads
- **Lucia** — mock the session cookie decoder to return valid/null sessions
- **External provider** — mock the provider SDK's token verification function

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

### Step 8: Verify

1. Run `npx next build` to verify the middleware compiles and is Edge-compatible
2. Verify the `matcher` config excludes `_next/static`, `_next/image`, and static file extensions
3. Verify that `middleware.ts` exports are correct (named export `middleware` + `config`)
4. Verify that no Prisma Client imports exist in `middleware.ts` or any file it imports
5. Run all existing tests to ensure the middleware does not break anything:
   - **Unit tests** — run `npx vitest run` (includes the new middleware unit tests from Step 7)
   - **Integration tests** — if integration test files exist (e.g. `**/*.integration.test.ts`), run them
   - **End-to-end tests** — if Playwright is configured (`playwright.config.ts` exists), run `npx playwright test`
   - If any test fails, fix the issue before proceeding. In retrofit mode, test failures likely
     indicate routes that need the auth setup from the migration checklist — note these in the
     summary but do not suppress or skip the tests
6. Create a minimal smoke test: describe to the user how to manually verify:
   - Visit a protected route (e.g. `/dashboard`) without being logged in → should redirect to login
   - Visit a public route (e.g. `/`) → should load normally
   - Check response headers in browser DevTools → security headers should be present

### Step 9: Summary

Present a summary of what was created:

```
## Web Middleware Created

### Auth Strategy
<chosen strategy>

### Files Created/Updated
| File                                     | Purpose                                |
|------------------------------------------|----------------------------------------|
| middleware.ts                            | Main middleware entry point (Edge)     |
| lib/auth/middleware.ts                   | Stateless session validation helpers   |
| lib/auth/constants.ts                    | Route rules and auth constants         |
| lib/auth/headers.ts                      | Security headers (including CSP)       |
| lib/auth/logger.ts                       | Structured middleware logger (Edge)    |
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

### Error Handling
- Middleware fails closed — unexpected errors redirect to login, never allow through
- All auth failures produce structured JSON logs with path, method, and error context
- Debug-level logs (public route allowed, authenticated allowed) are suppressed in production

### Test Results
- Unit tests: X passed, Y failed
- Integration tests: X passed, Y failed (or N/A if none exist)
- End-to-end tests: X passed, Y failed (or N/A if Playwright not configured)
- [If any failures, list them and explain whether they are pre-existing or caused by the middleware]

### What This Enables for Feature Implementation
- `getSessionFromRequest(request)` is available in API routes and server actions
- Protected routes automatically redirect to login
- Role-based routes enforce access checks
- Security headers (including CSP) are applied to all responses
- Structured logs make auth issues debuggable via `source:"middleware"` filter
- The `/implement` skill can assume auth infrastructure exists

### Retrofit (if applicable)
- Mode: Greenfield / Retrofit
- Existing routes affected: N
- Breaking changes: N files
- Ad-hoc auth to consolidate: N files
- Migration checklist: docs/technical_tasks/TT-XXX-middleware-retrofit.md

### Next Steps
- Implement the auth API routes (login, signup, session endpoints) — e.g. `/api/auth/[...nextauth]/route.ts` for NextAuth or custom routes for JWT/Lucia
- Implement the login/signup pages as a use case with `/implement`
- If in retrofit mode: run `/implement TT-XXX-middleware-retrofit` to adapt existing code
- Configure OAuth providers and fill in `# TODO:` env vars (if applicable)
- Tune the Content-Security-Policy header for your project's specific needs
- Run `/implement` for your next use case
```
