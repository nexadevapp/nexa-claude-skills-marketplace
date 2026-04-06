import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, type TestUser } from '../helpers/test-user';

// ── Suite-level user: shared across all tests in this file ──────────────

let suiteUser: TestUser;

test.beforeAll(async ({ request }) => {
  suiteUser = await createTestUser(request, { accountType: 'BUYER' });
});

test.afterAll(async ({ request }) => {
  await deleteTestUser(request, suiteUser.id);
});

// One describe per use case — tests are complete journeys, not per-screen fragments
test.describe('UC-001: Manage Items', { tag: ['@UC-001'] }, () => {

  // ── Helper: log in as a given user via the UI ───────────────────────
  async function loginViaUI(page: import('@playwright/test').Page, user: TestUser) {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.plainPassword);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForLoadState('networkidle');
  }

  // ── Helper: log out via the UI ──────────────────────────────────────
  async function logoutViaUI(page: import('@playwright/test').Page) {
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.waitForLoadState('networkidle');
  }

  // MSS: the full happy path as one test — entry point to final outcome
  test('MSS: user logs in, navigates to items, creates item, and sees it in the list', { tag: ['@MSS', '@FR-001', '@FR-002'] }, async ({ page }) => {
    // 1. Log in as the suite user
    await loginViaUI(page, suiteUser);

    // 2. Navigate to the Items page through the UI (not via page.goto('/items'))
    await page.getByRole('link', { name: 'Items' }).click();
    await page.waitForLoadState('networkidle');

    // 3. Verify the list screen loaded
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();

    // 4. Navigate to the create form through the UI
    await page.getByRole('button', { name: 'Add New' }).click();

    // 5. Fill the form and submit
    await page.getByRole('button', { name: 'Save' }).click();
    // Verifies BR-001: Mandatory Field Validation
    await expect(page.getByText('Name is required')).toBeVisible();

    await page.getByLabel('Name').fill('E2E Test Item');
    await page.getByLabel('Description').fill('Created by E2E test');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForLoadState('networkidle');

    // 6. Verify the final outcome
    // Verifies Success Postcondition: Item Stored and Visible
    await expect(page.locator('table tbody tr')).toContainText(['E2E Test Item']);

    // 7. Log out
    await logoutViaUI(page);

    // Cleanup entity data (not the user — suite user is cleaned in afterAll)
    const response = await page.request.get('/api/examples?name=E2E+Test+Item');
    const items = await response.json();
    if (items.length > 0) {
      await page.request.delete(`/api/examples/${items[0].id}`);
    }
  });

  // AF1: alternative flow — empty state
  test('AF1: user logs in, navigates to items, and sees empty state when no items exist', async ({ page }) => {
    await loginViaUI(page, suiteUser);

    // Clear seed data for this scenario via API
    const response = await page.request.get('/api/examples');
    const allItems = await response.json();
    for (const item of allItems) {
      await page.request.delete(`/api/examples/${item.id}`);
    }

    // Navigate to Items through the UI
    await page.getByRole('link', { name: 'Items' }).click();
    await page.waitForLoadState('networkidle');

    // Verify the empty state
    await expect(page.getByText('No items found')).toBeVisible();

    await logoutViaUI(page);
  });

  // AF2: per-test user override — suspended user cannot access items
  test('AF2: suspended user sees account-locked screen after login', async ({ page, request }) => {
    // Create a per-test user with SUSPENDED status
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
      // Always clean up the per-test user, even if assertions fail
      await deleteTestUser(request, suspendedUser.id);
    }
  });
});
