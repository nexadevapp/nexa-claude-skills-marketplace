import { test, expect } from '@playwright/test';

test.describe('Example Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples');
    await page.waitForLoadState('networkidle');
  });

  test('should display list of items', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();
    await expect(rows).toHaveCount(10);
  });

  test('should navigate to detail page on row click', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();
    const name = await firstRow.locator('td').first().innerText();

    await firstRow.click();

    await expect(page).toHaveURL(/\/examples\/.+/);
    await expect(page.getByRole('heading')).toContainText(name);
  });

  test('should create a new item via form', async ({ page }) => {
    await page.getByRole('button', { name: 'Add New' }).click();

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

  test('should validate required fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Add New' }).click();

    // Submit without filling required fields
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Name is required')).toBeVisible();
  });
});
