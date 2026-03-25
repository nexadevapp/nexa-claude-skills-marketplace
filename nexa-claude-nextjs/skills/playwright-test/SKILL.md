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

Before running Playwright tests, ensure all required dependencies are running:

1. **PostgreSQL** — Start a Docker container if one is not already running:
    - Check with `docker ps` for an existing postgres container
    - If none exists, start one using the project's `docker-compose.yml` (e.g., `docker compose up -d`)
    - If no `docker-compose.yml` exists, start postgres directly:
      ```bash
      docker run -d --name postgres-dev \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=app \
        -p 5432:5432 \
        postgres:16
      ```
    - Verify the container is healthy before proceeding
2. **Database migrations** — Run `npx prisma migrate deploy` (or `npx prisma db push`) to ensure the schema is up to date
3. **Seed data** — Run `npx prisma db seed` if the project has a seed script and baseline data is needed
4. **Dev server** — Start the Next.js dev server (`npm run dev`) if not already running; Playwright's `webServer` config in `playwright.config.ts` may handle this automatically

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
