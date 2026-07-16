# Playwright Test Reference

Extended examples, templates, and reference tables for `playwright-test/SKILL.md`. Templates
referenced below live in [templates/](templates/) — copy them verbatim unless the section says
otherwise.

## Traceability Convention Details

**Multiple UCs per file** (when journeys share a page or flow): one top-level
`test.describe(...)` block per UC.

**Pure bug regression tests** (no clean UC home) — file `bug-NNN-*.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { bug } from './helpers/traced';

test('[regression description]', bug('BUG-NNN'), async ({ page }) => {
  // ... test body
});
```

**Full annotated example:**

```typescript
import { test, expect } from '@playwright/test';
import { uc, meta } from './helpers/traced';

test.describe('UC-XXX: [Use Case Name]', uc('UC-XXX'), () => {
  test('[end-to-end journey description]',
    meta('UC-XXX', {
      scenario: 'MSS',
      verifies: ['CR-NNN'], // optional: change requests this test asserts the delta of
      fixes: ['BUG-NNN'],   // optional: bugs this test guards against regressing
    }),
    async ({ page }) => {
      // ... test body
    });

  test('[alternative flow description]',
    meta('UC-XXX', { scenario: 'AF-1' }),
    async ({ page }) => {
      // ... test body
    });
});
```

**Why raw `test.describe()` instead of a custom wrapper:** JetBrains'
Playwright plugin (and the VSCode equivalent) only walks `test()` and
`test.describe()` calls — it does not enter callbacks of arbitrary helper
functions. A `useCase()` wrapper that calls `test.describe()` internally
works at runtime but hides the inner tests from the IDE's AST walker. Keeping
`test.describe(...)` literally in source is what makes gutter run/debug icons
appear for each test.

The UC id is repeated three times per describe (title, `uc()`, each `meta()`).
This is intentional: a single source of truth would require either fragile
module-level state or a wrapper the IDE can't see into.

**Inline comments** — when a single line/assertion exists *because of* a CR or
BUG, leave a one-line marker comment so a code reader sees it without reading
tags:

```typescript
// CR-003: month/year picker
await page.locator('input[type="month"]').first().fill('2025-06');

// Verifies BR-001: [Rule Name]
await expect(page.getByText('Error')).toBeVisible();

// Verifies Success Postcondition: [Postcondition Name]
await expect(page.locator('table')).toContainText(['New Item']);
```

## Test User Provisioning Details

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
2. **After each test:** Clear cookies and storage to prevent session leakage between tests.
3. **After all tests:** Delete the user and all related records via the test API endpoint.

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
3. **After the test:** Delete this custom user and all related records via the test API endpoint (use `finally` blocks to ensure cleanup runs even on failure). Cookies are cleared by the suite-level `afterEach`.

## `.env.e2e` Contents

```
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/testdb
DIRECT_URL=postgresql://test:test@localhost:5432/testdb
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SECRET=test-secret-for-vitest-at-least-32-characters-long
AUTH_URL=http://localhost:3000
E2E_TEST=true
```

Add project-specific env vars as needed.

## Playwright Configuration Example

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 3 : 6,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    // .env.e2e is the single source of truth for E2E test env vars.
    // `set -a` exports all sourced vars into the process environment.
    command: 'bash -c \'set -a; source .env.e2e; set +a; exec npx next dev\'',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 60_000,
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

## Common Patterns Details

### Suite-Level User Provisioning

```typescript
import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, type TestUser } from './helpers/test-user';

let suiteUser: TestUser;

test.beforeAll(async ({ request }) => {
  // Create the suite-level user via test API
  suiteUser = await createTestUser(request, { accountType: 'BUYER' });
});

test.afterEach(async ({ context }) => {
  // Clear cookies and storage between tests to prevent session leakage
  await context.clearCookies();
});

test.afterAll(async ({ request }) => {
  await deleteTestUser(request, suiteUser.id);
});
```

### Login via UI (start of each test)

```typescript
test.describe('UC-XXX: [Use Case Name]', uc('UC-XXX'), () => {
  test('user signs in and lands on dashboard',
    meta('UC-XXX', { scenario: 'MSS' }),
    async ({ page }) => {
      // Start at login — the ONLY page.goto() allowed
      await page.goto('/login');
      await expect(page.getByLabel('Email')).toBeVisible();

      // Log in as the suite user
      await page.getByLabel('Email').fill(suiteUser.email);
      await page.getByLabel('Password').fill(suiteUser.plainPassword);
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

      // ... continue the journey
    });
});
```

### Per-Test User Override

```typescript
test.describe('UC-XXX: [Use Case Name]', uc('UC-XXX'), () => {
  test('suspended user sees account-locked screen',
    meta('UC-XXX', { scenario: 'AF-2' }),
    async ({ page, request }) => {
      // Create a custom user for this test
      const suspendedUser = await createTestUser(request, {
        accountType: 'BUYER',
        status: 'SUSPENDED',
      });

      try {
        await page.goto('/login');
        await expect(page.getByLabel('Email')).toBeVisible();
        await page.getByLabel('Email').fill(suspendedUser.email);
        await page.getByLabel('Password').fill(suspendedUser.plainPassword);
        await page.getByRole('button', { name: 'Sign in' }).click();

        // Verify suspended user sees the locked screen
        await expect(page.getByText('Account suspended')).toBeVisible();
      } finally {
        // Always clean up the per-test user
        await deleteTestUser(request, suspendedUser.id);
      }
    });
});
```

### Entry Point — the only `page.goto()` in the test

```typescript
// Start at the application entry point — the ONLY page.goto() allowed
await page.goto('/');
await expect(page.getByRole('heading')).toBeVisible();
```

### Navigate Through the UI (never via URL)

```typescript
// Click a navigation link to reach the next screen
await page.getByRole('link', { name: 'Items' }).click();
await expect(page.getByRole('heading', { name: 'Items' })).toBeVisible();

// Click a button to open a form/modal
await page.getByRole('button', { name: 'Add New' }).click();

// Click a table row to navigate to detail
await page.locator('table tbody tr').first().click();
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

## Assertions Reference Table

| Assertion Type   | Example                                                   |
|------------------|-----------------------------------------------------------|
| Text content     | `await expect(locator).toHaveText('Expected')`            |
| Input value      | `await expect(locator).toHaveValue('value')`              |
| Element count    | `await expect(locator).toHaveCount(5)`                    |
| Visibility       | `await expect(locator).toBeVisible()`                     |
| URL              | `await expect(page).toHaveURL('/path')`                   |
| Enabled          | `await expect(locator).toBeEnabled()`                     |
| Contains text    | `await expect(locator).toContainText('partial')`          |
