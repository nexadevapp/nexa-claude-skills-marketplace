---
name: playwright-test
description: >
  Creates Playwright browser-based end-to-end tests for Next.js pages covering
  complete user journeys from start to finish. Use when the user asks to "write
  Playwright tests", "create e2e tests", "write integration tests", "test in
  the browser", or mentions end-to-end testing, browser tests, UI integration
  tests, or Playwright for Next.js.
---

# Playwright Test

## Instructions

Create Playwright end-to-end tests for Next.js pages based on the use case $ARGUMENTS. Playwright tests run in a real browser against the running application with a real database via Testcontainers.

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
- **1 test** for the Main Success Scenario (the happy path, all steps start to finish)
- **1 test per Alternative Flow** that diverges meaningfully from the MSS
- Business rules are verified **inline** within the journey they belong to, not as separate tests

A typical use case produces **3–8 tests total**, not dozens.

**What makes it E2E:**
- The test starts at the application's entry point (e.g., landing page, login screen)
- Every navigation happens through UI interactions (clicks, form submissions) — never `page.goto()` to internal pages
- The test verifies intermediate states along the way, not just the final outcome
- The test ends with a verifiable outcome (data visible, confirmation shown, redirect happened)

**`page.goto()` is only used ONCE per test** — to open the application entry point (e.g., `page.goto('/')` or `page.goto('/login')`). All subsequent navigation must happen through the UI.

## Traceability Convention

**`test.describe`** — one describe block per use case:
```
test.describe('UC-XXX: [Use Case Name]', () => { ... })
```

**`test`** — one test per complete journey:
```
test('MSS: [end-to-end journey description]', ...)          // Main Success Scenario
test('AF[n]: [end-to-end journey description]', ...)         // Alternative Flow
```

Each test name describes the complete journey, not an individual step. For example:
- Good: `'MSS: user registers, verifies email, and lands on dashboard'`
- Bad: `'MSS Steps 1-2: displays registration form'`

## DO NOT

- **Navigate with `page.goto()` to internal pages** — only use `page.goto()` once per test to open the entry point. All other navigation must happen through clicking links, buttons, and submitting forms. This is the most important rule: if you bypass navigation, you are not testing E2E
- **Write one test per step or per screen** — each test must cover the full journey. A test that only checks "form displays correctly" is not an E2E test
- **Create separate tests for business rules** — verify business rules inline within the journey where they apply
- **Run tests on multiple browsers** — use Chromium only. The `playwright.config.ts` must have exactly one project
- Access the database directly in tests — use the test API endpoints (`/api/e2e/users`) instead
- Skip waiting for page loads or network requests to complete
- Use hard-coded delays (`page.waitForTimeout`) instead of proper waits
- Delete all data in cleanup (only remove data created during the test)
- Hard-code database connection strings — `DATABASE_URL` is injected by global setup
- Write tests that contradict the frontend design (e.g., asserting a table when the design specifies cards)
- **Skip, exclude, or filter out tests** — never use `--grep-invert`, `--grep`, `test.skip()`, `test.fixme()`, or any other mechanism to avoid running tests. All tests must run and pass
- **Claim tests pass without verifying output** — you must check the actual Playwright output for "X passed" and "0 failed" before declaring success
- **Ignore or work around database-dependent tests** — Testcontainers provides the database; if Docker is not running, stop and tell the user instead of skipping DB tests
- **Write no-op or trivially-true tests** — every test must contain meaningful assertions that would fail if the feature were broken (e.g., never assert `expect(true).toBe(true)` or assert only that a page loads without checking content)

## Test User Provisioning

Every E2E test requires an authenticated user. User provisioning operates at two levels:

### Suite-Level User (default)

Each test file provisions **one shared user** for all tests in the file. This user is a standard,
fully-valid user suitable for happy-path scenarios.

**Lifecycle (managed via `test.beforeAll` / `test.afterAll`):**

1. **Before all tests:** Create a user directly in the database via the test API endpoint:
   - Email: `e2e-{random8chars}@example.com`
   - Password: bcrypt-hashed (plaintext stored in a variable for login)
   - `account_type`: as needed by the use case (default to the most common type)
   - `status`: `"ACTIVE"`
   - `email_confirmed`: `true`
   - All consent flags: `true`
   - `auth_provider`: `"EMAIL"`
   - `created_at` / `updated_at`: current timestamp
2. **Before all tests (after user creation):** Log in via the login page UI and save the authenticated state.
3. **After all tests:** Log out via the UI (click "Sign out").
4. **After all tests (after logout):** Delete the user and all related records via the test API endpoint.

### Per-Test User Override

Individual tests that need a user with **different characteristics** (e.g., inactive status,
unconfirmed email, a different account type) provision their own user, overriding the suite-level user.

**Lifecycle (managed via `test.beforeEach` / `test.afterEach` or inline):**

1. **Before the test:** Create a custom user directly in the database via the test API endpoint:
   - Email: `e2e-{random8chars}@example.com`
   - Password: bcrypt-hashed (plaintext stored in a variable for login)
   - `account_type`: as needed by the specific test scenario
   - `status`: as needed by the test scenario (e.g., `"SUSPENDED"`, `"PENDING"`)
   - `email_confirmed`: as needed (e.g., `false` for unconfirmed-email flows)
   - All consent flags: `true`
   - `auth_provider`: `"EMAIL"`
   - `created_at` / `updated_at`: current timestamp
2. **Start of test:** Log in as this custom user via the login page UI.
3. **End of test:** Log out via the UI (click "Sign out").
4. **After the test:** Delete this custom user and all related records via the test API endpoint.

### Test API Endpoint

The application must expose a test-only API endpoint for user provisioning and cleanup. This endpoint
is **only available when `NODE_ENV=test`**:

- `POST /api/e2e/users` — Creates a user in the database. Accepts the user fields above. Returns the created user with `id`.
- `DELETE /api/e2e/users/:id` — Deletes the user and all related records (cascade).

If this endpoint does not exist in the project, create it before writing tests. Use the template at
[templates/e2e-users-api.ts](templates/e2e-users-api.ts).

### Test User Helper

Use the helper at [templates/test-user.ts](templates/test-user.ts) to provision and clean up users.
If `e2e/helpers/test-user.ts` does not exist, create it from the template.

### Other Test Data

| Approach          | Location                     | Purpose                          |
|-------------------|------------------------------|----------------------------------|
| Prisma seed       | prisma/seed.ts               | Baseline reference data (non-user)|
| API calls         | Within test setup            | Test-specific entity data        |
| Manual cleanup    | afterEach hooks              | Remove data created during test  |

## External Dependencies

Read and follow the dependency strategies in `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/mocking/MOCKING.md`.

## Testcontainers Global Setup

Before writing tests, ensure the project has a global setup file that starts a PostgreSQL
Testcontainer, runs Prisma migrations, seeds the database, and starts the Next.js dev server.

If `e2e/global-setup.ts` does not exist, create it using [templates/global-setup.ts](templates/global-setup.ts).

Ensure `playwright.config.ts` references the global setup and does **not** use `webServer`
(the global setup handles both the database and the dev server).

**Single browser only** — use Chromium. Do NOT add Firefox or WebKit projects. Cross-browser
testing is not the purpose of E2E tests; verifying user journeys is.

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  fullyParallel: false, // E2E journeys may share state; run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // one worker — journeys are sequential
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Do NOT add firefox or webkit — single browser only for E2E
  ],
});
```

## Templates

- Global setup: [templates/global-setup.ts](templates/global-setup.ts)
- Global teardown: [templates/global-teardown.ts](templates/global-teardown.ts)
- Test user helper: [templates/test-user.ts](templates/test-user.ts)
- E2E users API endpoint: [templates/e2e-users-api.ts](templates/e2e-users-api.ts)
- Test example: [templates/example.spec.ts](templates/example.spec.ts)

## Common Patterns

### Suite-Level User Provisioning

```typescript
import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, type TestUser } from './helpers/test-user';

let suiteUser: TestUser;

test.beforeAll(async ({ request }) => {
  // Create the suite-level user via test API
  suiteUser = await createTestUser(request, { accountType: 'BUYER' });
});

test.afterAll(async ({ request, browser }) => {
  // Log out via UI, then delete the user
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await context.close();

  await deleteTestUser(request, suiteUser.id);
});
```

### Login via UI (start of each test)

```typescript
test('MSS: ...', async ({ page }) => {
  // Start at login — the ONLY page.goto() allowed
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Log in as the suite user
  await page.getByLabel('Email').fill(suiteUser.email);
  await page.getByLabel('Password').fill(suiteUser.plainPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForLoadState('networkidle');

  // ... continue the journey
});
```

### Per-Test User Override

```typescript
test('AF2: suspended user sees account-locked screen', async ({ page, request }) => {
  // Create a custom user for this test
  const suspendedUser = await createTestUser(request, {
    accountType: 'BUYER',
    status: 'SUSPENDED',
  });

  try {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Email').fill(suspendedUser.email);
    await page.getByLabel('Password').fill(suspendedUser.plainPassword);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForLoadState('networkidle');

    // Verify suspended user sees the locked screen
    await expect(page.getByText('Account suspended')).toBeVisible();
  } finally {
    // Always clean up the per-test user
    await deleteTestUser(request, suspendedUser.id);
  }
});
```

### Entry Point — the only `page.goto()` in the test

```typescript
// Start at the application entry point — the ONLY page.goto() allowed
await page.goto('/');
await page.waitForLoadState('networkidle');
```

### Navigate Through the UI (never via URL)

```typescript
// Click a navigation link to reach the next screen
await page.getByRole('link', { name: 'Items' }).click();
await page.waitForLoadState('networkidle');

// Click a button to open a form/modal
await page.getByRole('button', { name: 'Add New' }).click();

// Click a table row to navigate to detail
await page.locator('table tbody tr').first().click();
await page.waitForLoadState('networkidle');

// Verify you arrived at the expected screen
await expect(page.getByRole('heading')).toContainText('Item Details');
```

### Verify Intermediate State Along the Journey

```typescript
// After navigating to the list screen, verify it loaded correctly
const rows = page.locator('table tbody tr');
await expect(rows.first()).toBeVisible();
await expect(rows).toHaveCount(10);

// Then continue the journey...
await page.getByRole('button', { name: 'Create' }).click();
```

### Form Interactions

```typescript
await page.getByLabel('Name').fill('Test Value');
await page.getByLabel('Category').selectOption('option-1');
await page.getByLabel('Active').check();
await page.getByRole('button', { name: 'Save' }).click();
await page.waitForLoadState('networkidle');
```

### Verify Final Outcome

```typescript
// After form submission, verify the result is visible
await expect(page.getByText('Item created successfully')).toBeVisible();
await expect(page.locator('table tbody tr')).toContainText(['Test Value']);
```

### Cleanup Entity Data Created During Test

```typescript
// Clean up non-user test data via API at end of test
await page.request.delete(`/api/examples/${createdId}`);
```

### Dialog Interactions

```typescript
page.on('dialog', dialog => dialog.accept());
await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
```

## Assertions Reference

| Assertion Type   | Example                                                   |
|------------------|-----------------------------------------------------------|
| Text content     | `await expect(locator).toHaveText('Expected')`            |
| Input value      | `await expect(locator).toHaveValue('value')`              |
| Element count    | `await expect(locator).toHaveCount(5)`                    |
| Visibility       | `await expect(locator).toBeVisible()`                     |
| URL              | `await expect(page).toHaveURL('/path')`                   |
| Enabled          | `await expect(locator).toBeEnabled()`                     |
| Contains text    | `await expect(locator).toContainText('partial')`          |

## Tracking

Read and follow the **Before Implementation** steps in `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/tracking/TRACKING.md`.

## Workflow

1. Read the use case specification from `docs/use_cases/`
2. Read the frontend design from `docs/designs/` — extract screens, components, states, and navigation flow
3. **Plan the journeys** — map each test to a complete path through the application:
    - One test for the MSS: entry point → each screen in sequence → final outcome
    - One test per AF that diverges from the MSS
    - Note the entry point URL (the only `page.goto()` allowed) and every UI interaction needed to complete each journey
    - Identify which business rules are verified inline within each journey
4. Use TodoWrite to create a task for each journey test (expect 3–8 tests total, not dozens)
5. Ensure Testcontainers global setup exists (`e2e/global-setup.ts`); create from template if missing
6. Ensure global teardown exists (`e2e/global-teardown.ts`); create from template if missing
7. Ensure `playwright.config.ts` references the global setup/teardown and has **only Chromium** (one project)
8. Ensure the test user helper exists (`e2e/helpers/test-user.ts`); create from template if missing
9. Ensure the E2E users API endpoint exists (`app/api/e2e/users/route.ts` and `app/api/e2e/users/[id]/route.ts`); create from template if missing
10. Create test file using the template
11. For each journey test:
    - Set up suite-level user in `test.beforeAll` (create via test API, log in via UI)
    - For tests needing a custom user, create a per-test user override (see Common Patterns)
    - `page.goto()` to the login page (the **only** goto in the test), log in via UI
    - Navigate through each screen by clicking links, buttons, and submitting forms
    - Verify intermediate states along the way (page loaded, data displayed, form visible)
    - Perform the key interactions (fill forms, click actions, confirm dialogs)
    - Assert the final outcome (success message, data in list, redirect to expected page)
    - Log out via UI at end of test (or in `test.afterAll` for suite user)
    - Clean up test-specific entity data if created during test
    - Clean up per-test override users in `finally` blocks or `test.afterEach`
    - Delete suite user in `test.afterAll`
12. Run code quality checks as described in `nexa-claude-nextjs/skills/code-quality/CODE_QUALITY.md`
13. Run **all** tests with `npx playwright test` (no filters, no `--grep`, no `--grep-invert`, no `--project` subset)
14. **Verify the test results — this is mandatory before declaring success:**
    - The Playwright output must show **0 failed** and the exit code must be **0**
    - If the output shows failures, timeouts, or errors, the tests **did not pass** — do not claim otherwise
    - Count the number of passed tests and confirm it matches the number of tests you wrote
    - If any test is skipped, that counts as a failure — investigate and fix it
    - **If a test failure reveals a route mismatch** (e.g., test expects `/register` but app uses `/sign-up`), this means the test is not navigating through the UI — fix the test to click through the real navigation instead of hardcoding URLs
15. If a test fails:
    - Check that Docker is running (Testcontainers requires it)
    - Read the error message carefully and fix the root cause in the test or implementation
    - Re-run `npx playwright test` and go back to step 14
    - Use `await page.screenshot()` for debugging visual state if needed
    - Do NOT skip, exclude, or filter out failing tests as a "fix"
16. Mark todos complete

## Post-Implementation Tracking

Read and follow the **After Implementation** steps in `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/tracking/TRACKING.md`.
