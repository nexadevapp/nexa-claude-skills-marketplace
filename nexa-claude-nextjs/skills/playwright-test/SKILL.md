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

Create Playwright end-to-end tests for Next.js pages based on the use case $ARGUMENTS. Playwright tests run in a real browser against the running application.

## DO NOT

- Access the database or backend services directly in tests
- Skip waiting for page loads or network requests to complete
- Use hard-coded delays (`page.waitForTimeout`) instead of proper waits
- Assume all list/table items are visible (scroll if needed)
- Delete all data in cleanup (only remove data created during the test)

## Test Data Strategy

| Approach          | Location                     | Purpose              |
|-------------------|------------------------------|----------------------|
| Prisma seed       | prisma/seed.ts               | Baseline test data   |
| API calls         | Within test setup            | Test-specific data   |
| Manual cleanup    | afterEach hooks              | Remove created data  |

## External Dependencies

Read and follow the dependency strategies in `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/mocking/MOCKING.md`.

### Automated Preflight (Recommended)

Run the preflight skill before e2e tests:

```
/preflight
```

This automatically handles all dependency setup. See `nexa-claude-nextjs/skills/preflight/SKILL.md`.

### Manual Dependency Setup

If running tests manually without preflight:

#### 1. PostgreSQL — Start Test Database

```bash
# Check for existing container
docker ps --filter "name=postgres" --format "{{.Names}}"

# If no container, use docker-compose.test.yml (recommended)
docker compose -f docker-compose.test.yml up -d

# Or start directly
docker run -d --name postgres-test \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=test \
  -p 5432:5432 \
  --health-cmd="pg_isready -U postgres" \
  --health-interval=5s \
  --health-timeout=5s \
  --health-retries=5 \
  postgres:16

# Wait for healthy status
docker inspect --format='{{.State.Health.Status}}' postgres-test
```

#### 2. Database Migrations

```bash
npx prisma migrate deploy
```

#### 3. Seed Data

```bash
# Only if seed script exists in package.json
npx prisma db seed
```

#### 4. Dev Server

Start manually or let Playwright's webServer config handle it:

```bash
npm run dev
```

### webServer Configuration

Ensure `playwright.config.ts` has proper webServer configuration. Use the template at
[templates/playwright.config.partial.ts](../preflight/templates/playwright.config.partial.ts):

```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  timeout: 120 * 1000,
  reuseExistingServer: !process.env.CI,
  stdout: 'pipe',
  stderr: 'pipe',
}
```

Key settings:
- `timeout: 120000` — 2 minutes for slow cold starts
- `reuseExistingServer: !process.env.CI` — Reuse in dev, fresh in CI
- `stdout/stderr: 'pipe'` — Capture output for debugging

### Docker Compose Template

Copy [templates/docker-compose.test.yml](templates/docker-compose.test.yml) to your project root for
consistent test database configuration.

## Test Cleanup Strategy

**Reset database to seed state BEFORE running tests**, not just after. This ensures consistent
starting conditions regardless of previous test failures.

### Pre-Test Cleanup

Add to your test setup or run manually before `npx playwright test`:

```bash
# Reset database to migration baseline
npx prisma migrate reset --force --skip-seed

# Re-apply seed data for consistent baseline
npx prisma db seed
```

Or in a global setup file (`playwright/global-setup.ts`):

```typescript
import { execSync } from 'child_process';

async function globalSetup() {
  console.log('🧹 Resetting database to seed state...');
  execSync('npx prisma migrate reset --force --skip-seed', { stdio: 'inherit' });
  execSync('npx prisma db seed', { stdio: 'inherit' });
  console.log('✅ Database ready');
}

export default globalSetup;
```

Register in `playwright.config.ts`:

```typescript
export default defineConfig({
  globalSetup: './playwright/global-setup.ts',
  // ...
});
```

### Per-Test Cleanup

For data created during individual tests, clean up in `afterEach`:

```typescript
test.afterEach(async ({ page }) => {
  // Delete only data created by this test
  // Use API calls or direct cleanup
});
```

**DO NOT** delete all data in cleanup — only remove test-specific data.

## Template

Use [templates/example.spec.ts](templates/example.spec.ts) as the test structure.

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

1. Start external dependencies as described in **External Dependencies** above
2. Read the use case specification
3. Use TodoWrite to create a task for each test scenario
4. Create test file using the template
5. For each test:
    - Navigate to the page
    - Wait for content to load
    - Locate elements using accessible selectors (role, label, text)
    - Perform interactions
    - Assert expected outcomes
    - Clean up test data if created during test
6. Run code quality checks as described in `nexa-claude-nextjs/skills/code-quality/CODE_QUALITY.md`
7. Run tests with `npx playwright test` to verify they pass
8. If a test fails:
    - Use `npx playwright test --ui` for visual debugging
    - Check that the dev server is running
    - Verify selectors with `page.pause()` for interactive debugging
    - Use `await page.screenshot()` for debugging visual state
9. Mark todos complete

## Post-Implementation Tracking

Read and follow the **After Implementation** steps in `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/tracking/TRACKING.md`.
