---
name: playwright-test
description: >
  Creates Playwright browser-based end-to-end tests for Next.js pages covering
  navigation, form interactions, data display, and user workflows. Use when the
  user asks to "write Playwright tests", "create e2e tests", "write integration
  tests", "test in the browser", or mentions end-to-end testing, browser tests,
  UI integration tests, or Playwright for Next.js.
---

# Playwright Test

## Instructions

Create Playwright end-to-end tests for Next.js pages based on the use case $ARGUMENTS. Playwright tests run in a real browser against the running application with a real database via Testcontainers.

## Inputs

| Input | Location | Required |
|-------|----------|----------|
| Use case specification | `docs/use_cases/UC-XXX.md` | Yes |
| Frontend design | `docs/designs/UC-XXX-design.md` | Yes |

The **use case specification** defines *what* the system does (scenarios, alternative flows, business
rules). The **frontend design** defines *how* it looks and behaves (screens, components, states,
user actions, navigation flow). Together they determine the test scenarios and assertions:

- **Test scenarios** derive from the use case Main Success Scenario and Alternative Flows
- **Page structure and selectors** derive from the frontend design's Components and Layout sections
- **Assertions** derive from the frontend design's States (default, loading, empty, error, success) and Data Displayed sections
- **User interactions** derive from the frontend design's User Actions (triggers, results)
- **Navigation expectations** derive from the frontend design's Navigation Flow and Screen Map

If `docs/designs/$ARGUMENTS-design.md` does not exist, stop and tell the user to run `/frontend-design $ARGUMENTS` first.

## Traceability Convention

Every test must be traceable to the use case scenario and frontend design screen it validates.

**`test.describe`** — maps to a screen from the frontend design. Use the format:
```
test.describe('Screen: [Screen Name]', () => { ... })
```

**`test`** — references the use case flow being tested. Use the format:
```
test('UC-XXX MSS Steps N-M: [what is verified]', ...)     // Main Success Scenario
test('UC-XXX AF[n]: [what is verified]', ...)              // Alternative Flow
test('UC-XXX BR[n]: [what is verified]', ...)              // Business Rule
```

This convention allows any test failure to be traced back to the exact use case flow and design
screen it validates.

## DO NOT

- Access the database or backend services directly in tests
- Skip waiting for page loads or network requests to complete
- Use hard-coded delays (`page.waitForTimeout`) instead of proper waits
- Assume all list/table items are visible (scroll if needed)
- Delete all data in cleanup (only remove data created during the test)
- Hard-code database connection strings — `DATABASE_URL` is injected by global setup
- Write tests that contradict the frontend design (e.g., asserting a table when the design specifies cards)
- **Skip, exclude, or filter out tests** — never use `--grep-invert`, `--grep`, `test.skip()`, `test.fixme()`, or any other mechanism to avoid running tests. All tests must run and pass
- **Claim tests pass without verifying output** — you must check the actual Playwright output for "X passed" and "0 failed" before declaring success
- **Ignore or work around database-dependent tests** — Testcontainers provides the database; if Docker is not running, stop and tell the user instead of skipping DB tests
- **Write no-op or trivially-true tests** — every test must contain meaningful assertions that would fail if the feature were broken (e.g., never assert `expect(true).toBe(true)` or assert only that a page loads without checking content)

## Test Data Strategy

| Approach          | Location                     | Purpose              |
|-------------------|------------------------------|----------------------|
| Prisma seed       | prisma/seed.ts               | Baseline test data   |
| API calls         | Within test setup            | Test-specific data   |
| Manual cleanup    | afterEach hooks              | Remove created data  |

## External Dependencies

Read and follow the dependency strategies in `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/mocking/MOCKING.md`.

## Testcontainers Global Setup

Before writing tests, ensure the project has a global setup file that starts a PostgreSQL
Testcontainer, runs Prisma migrations, seeds the database, and starts the Next.js dev server.

If `e2e/global-setup.ts` does not exist, create it using [templates/global-setup.ts](templates/global-setup.ts).

Ensure `playwright.config.ts` references the global setup and does **not** use `webServer`
(the global setup handles both the database and the dev server):

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
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
  ],
});
```

## Templates

- Global setup: [templates/global-setup.ts](templates/global-setup.ts)
- Global teardown: [templates/global-teardown.ts](templates/global-teardown.ts)
- Test example: [templates/example.spec.ts](templates/example.spec.ts)

## Common Patterns

### Navigate to Page

```typescript
await page.goto('/examples');
```

### Wait for Content

```typescript
// Wait for specific element
await page.waitForSelector('table tbody tr');

// Wait for network idle
await page.waitForLoadState('networkidle');

// Wait for API response
await page.waitForResponse('**/api/examples');
```

### Table/List Operations

```typescript
// Count rows
const rows = page.locator('table tbody tr');
await expect(rows).toHaveCount(10);

// Get cell text
const firstCell = rows.first().locator('td').first();
await expect(firstCell).toHaveText('Expected Value');

// Click a row
await rows.first().click();
```

### Form Interactions

```typescript
// Fill text field
await page.getByLabel('Name').fill('Test Value');

// Select from dropdown
await page.getByLabel('Category').selectOption('option-1');

// Check checkbox
await page.getByLabel('Active').check();

// Click submit button
await page.getByRole('button', { name: 'Save' }).click();
```

### Navigation and Routing

```typescript
// Click a link
await page.getByRole('link', { name: 'Details' }).click();

// Verify URL changed
await expect(page).toHaveURL('/examples/123');

// Go back
await page.goBack();
```

### Dialog Interactions

```typescript
// Handle confirm dialog
page.on('dialog', dialog => dialog.accept());

// Modal dialog
await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
```

### API Interaction in Tests

```typescript
// Create test data via API
const response = await page.request.post('/api/examples', {
  data: { name: 'Test Item', description: 'Created by test' },
});
const created = await response.json();

// Clean up after test
await page.request.delete(`/api/examples/${created.id}`);
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
3. Use TodoWrite to create a task for each test scenario
3. Ensure Testcontainers global setup exists (`e2e/global-setup.ts`); create from template if missing
4. Ensure global teardown exists (`e2e/global-teardown.ts`); create from template if missing
5. Ensure `playwright.config.ts` references the global setup/teardown
6. Create test file using the template
7. For each test:
    - Navigate to the page
    - Wait for content to load
    - Locate elements using accessible selectors (role, label, text)
    - Perform interactions
    - Assert expected outcomes
    - Clean up test data if created during test
8. Run code quality checks as described in `nexa-claude-nextjs/skills/code-quality/CODE_QUALITY.md`
9. Run **all** tests with `npx playwright test` (no filters, no `--grep`, no `--grep-invert`, no `--project` subset)
10. **Verify the test results — this is mandatory before declaring success:**
    - The Playwright output must show **0 failed** and the exit code must be **0**
    - If the output shows failures, timeouts, or errors, the tests **did not pass** — do not claim otherwise
    - Count the number of passed tests and confirm it matches the number of tests you wrote
    - If any test is skipped, that counts as a failure — investigate and fix it
11. If a test fails:
    - Check that Docker is running (Testcontainers requires it)
    - Read the error message carefully and fix the root cause in the test or implementation
    - Re-run `npx playwright test` and go back to step 10
    - Use `await page.screenshot()` for debugging visual state if needed
    - Do NOT skip, exclude, or filter out failing tests as a "fix"
12. Mark todos complete

## Post-Implementation Tracking

Read and follow the **After Implementation** steps in `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/tracking/TRACKING.md`.
