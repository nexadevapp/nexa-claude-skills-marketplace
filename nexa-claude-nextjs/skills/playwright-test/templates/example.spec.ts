import { test, expect } from '@playwright/test';

// Screen: Item List (from frontend design)
test.describe('Screen: Item List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples');
    await page.waitForLoadState('networkidle');
  });

  test('UC-001 MSS Steps 1-2: displays list of items', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();
    await expect(rows).toHaveCount(10);
  });

  test('UC-001 MSS Step 3: navigates to detail page on row click', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();
    const name = await firstRow.locator('td').first().innerText();

    await firstRow.click();

    await expect(page).toHaveURL(/\/examples\/.+/);
    await expect(page.getByRole('heading')).toContainText(name);
  });

  test('UC-001 AF1: shows empty state when no items exist', async ({ page }) => {
    // Assumes seed data has been cleared for this scenario
    await expect(page.getByText('No items found')).toBeVisible();
  });
});

// Screen: Create Item (from frontend design)
test.describe('Screen: Create Item', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Add New' }).click();
  });

  test('UC-001 MSS Steps 4-6: creates a new item via form', async ({ page }) => {
    await page.getByLabel('Name').fill('Test Item');
    await page.getByLabel('Description').fill('Test description');
    await page.getByRole('button', { name: 'Save' }).click();

    await page.waitForLoadState('networkidle');

    await expect(page.locator('table tbody tr')).toContainText(['Test Item']);

    // Cleanup: delete the created item via API
    const response = await page.request.get('/api/examples?name=Test+Item');
    const items = await response.json();
    if (items.length > 0) {
      await page.request.delete(`/api/examples/${items[0].id}`);
    }
  });

  test('UC-001 BR1: validates required fields', async ({ page }) => {
    // Submit without filling required fields
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Name is required')).toBeVisible();
  });
});
