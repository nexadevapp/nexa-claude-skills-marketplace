import { test, expect } from '@playwright/test';

// One describe per use case — tests are complete journeys, not per-screen fragments
test.describe('UC-001: Manage Items', () => {

  // MSS: the full happy path as one test — entry point to final outcome
  test('MSS: user navigates to items, views list, creates item, and sees it in the list', async ({ page }) => {
    // 1. Start at the entry point — the ONLY page.goto() in the test
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 2. Navigate to the Items page through the UI (not via page.goto('/items'))
    await page.getByRole('link', { name: 'Items' }).click();
    await page.waitForLoadState('networkidle');

    // 3. Verify the list screen loaded with seed data
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();
    await expect(rows).toHaveCount(10);

    // 4. Navigate to the create form through the UI
    await page.getByRole('button', { name: 'Add New' }).click();

    // 5. Fill the form and submit (BR1: required field validation happens inline)
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Name is required')).toBeVisible(); // BR1 verified inline

    await page.getByLabel('Name').fill('E2E Test Item');
    await page.getByLabel('Description').fill('Created by E2E test');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForLoadState('networkidle');

    // 6. Verify the final outcome — new item appears in the list
    await expect(page.locator('table tbody tr')).toContainText(['E2E Test Item']);

    // Cleanup
    const response = await page.request.get('/api/examples?name=E2E+Test+Item');
    const items = await response.json();
    if (items.length > 0) {
      await page.request.delete(`/api/examples/${items[0].id}`);
    }
  });

  // AF1: alternative flow — the journey diverges when the list is empty
  test('AF1: user navigates to items and sees empty state when no items exist', async ({ page }) => {
    // Clear seed data for this scenario via API
    const response = await page.request.get('/api/examples');
    const allItems = await response.json();
    for (const item of allItems) {
      await page.request.delete(`/api/examples/${item.id}`);
    }

    // Start at the entry point
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Items through the UI
    await page.getByRole('link', { name: 'Items' }).click();
    await page.waitForLoadState('networkidle');

    // Verify the empty state
    await expect(page.getByText('No items found')).toBeVisible();

    // Re-seed data for other tests (or rely on global setup per-test isolation)
  });

  // MSS continued: view item detail by clicking a row
  test('MSS: user navigates to items and clicks a row to view detail', async ({ page }) => {
    // Start at the entry point
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Items through the UI
    await page.getByRole('link', { name: 'Items' }).click();
    await page.waitForLoadState('networkidle');

    // Click a row to navigate to detail
    const firstRow = page.locator('table tbody tr').first();
    const name = await firstRow.locator('td').first().innerText();
    await firstRow.click();
    await page.waitForLoadState('networkidle');

    // Verify the detail screen shows the correct item
    await expect(page.getByRole('heading')).toContainText(name);
  });
});
