# Web Middleware Reference

Detailed prompts, tables, and templates for `setup-web-middleware/SKILL.md`.

## Step 2 Retrofit Prompts

**2b. Existing request interception found:**

> **An existing request interception file was found. Choose how to proceed:**
>
> 1. **Extend** — keep existing logic and add auth/security layers around it
> 2. **Replace** — discard the current file and build from scratch
> 3. **Abort** — stop and let me review the existing file first

**2c. Impact analysis table** — for each route protection rule, map it against existing routes:

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

**2d. Ad-hoc auth consolidation table:**

> **Existing ad-hoc auth found in these files:**
>
> | File                       | Current Pattern                          | Recommendation          |
> |----------------------------|------------------------------------------|-------------------------|
> | `app/api/users/route.ts`   | `getServerSession()` + manual role check | Remove — interception layer handles it |
> | `app/actions/create-post.ts` | `auth()` guard at top of action        | Keep — server actions need explicit auth since the interception layer only covers the request |
> | `app/dashboard/page.tsx`   | `redirect()` if no session               | Remove — interception layer redirects |
>
> After the interception layer is built, I will update these files as part of the migration checklist.

## Step 2e Migration Checklist Task Fields

Create `docs/technical_tasks/TT-XXX-middleware-retrofit.md` using the template from
`nexa-claude-core/skills/technical-task/templates/technical-task.md` with:

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

## Step 5e Log Event Table

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

## Step 8 Unit Test Assertions

### 8a. `headers.test.ts` — Security Headers

Test the `securityHeaders()` function:

- Returns all required security headers (`Content-Security-Policy`, `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `X-DNS-Prefetch-Control`, `Permissions-Policy`)
- `Strict-Transport-Security` is present only when `NODE_ENV=production`
- `Strict-Transport-Security` is absent when `NODE_ENV=development`
- Header values match the expected defaults

### 8b. `logger.test.ts` — Structured Logger

Test the logger object:

- `debug` emits a JSON string to `console.debug` with correct fields (`timestamp`, `level`,
  `source`, `path`, `method`, `message`)
- `warn` and `error` emit to `console.warn` and `console.error` respectively
- `debug` is suppressed when `NODE_ENV=production`
- `debug` is emitted when `NODE_ENV` is not `production`
- Additional context fields (e.g. `userId`, `redirectTo`) are included in the output
- Mock `console` methods with `vi.spyOn` and parse the logged JSON to assert field values

### 8c. `middleware.test.ts` (lib/auth) — Session Helpers

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

## Step 10 CLAUDE.md Section Template

```markdown
## Web Middleware

<!-- NEXA_WEB_MIDDLEWARE_CONFIGURED -->

- Auth strategy: [chosen strategy, e.g. `next-auth` with JWT sessions]
- Request interception: [file name, e.g. `middleware.ts`] (runtime: [runtime, e.g. Edge])
- Instrumentation: [file name, e.g. `instrumentation.ts`]

### Auth helpers (`lib/auth/`)
- `middleware.ts` — `getSessionFromRequest(request)`, `isAuthenticated(session)`, `hasRole(session, role)`
- `constants.ts` — `PUBLIC_ROUTES`, `AUTH_ROUTES`, `ROLE_PROTECTED_ROUTES`, `DEFAULT_LOGIN_REDIRECT`, `LOGIN_PAGE`
- `headers.ts` — `securityHeaders()` (CSP, X-Frame-Options, HSTS in production, etc.)
- `logger.ts` — structured JSON logger for auth events

### Route protection rules
| Pattern             | Rule                              |
|---------------------|-----------------------------------|
| [actual patterns and rules from the setup]             |

### Middleware conventions for implementation
- Protected routes automatically redirect to login — no manual auth checks needed in pages
- Server actions called directly (not via fetch/form) bypass middleware — keep explicit auth in those
- Security headers are set in middleware only — do not duplicate in `next.config.js`
- The `/implement` skill can assume auth infrastructure exists
```

## Step 11 Summary Template

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
