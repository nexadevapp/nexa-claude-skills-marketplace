import { test, expect, type Page } from '@playwright/test';
import { useCase, meta, bug } from './helpers/traced';
import { createTestUser, deleteTestUser, type TestUser } from './helpers/test-user';

// ── Test rules (enforced for every test in this file) ───────────────────
//
// 1. ONE `page.goto(...)` per test — at the entry point only. All subsequent
//    navigation must happen through UI interactions (clicks, form submits).
// 2. `page.request.get/post/delete(...)` is API I/O, not navigation — use it
//    freely for setup, cleanup, and backend verification.
// 3. Wait for specific UI elements (heading, table row, form field). Never
//    use `page.waitForLoadState('networkidle')` — see the DO NOT list in
//    the playwright-test SKILL.
// 4. Every test passes either `meta(scenario, ...)` (inside a useCase()) or
//    `bug(id)` (pure regression) as its second arg, so the test inherits the
//    right tags and the helper validates referenced docs at registration.

// ── Suite-level user (shared across all tests in this file) ─────────────

let suiteUser: TestUser;

test.beforeAll(async ({ request }) => {
  suiteUser = await createTestUser(request, { accountType: 'BUYER' });
});

test.afterEach(async ({ context }) => {
  // Clear cookies between tests to prevent session leakage
  await context.clearCookies();
});

test.afterAll(async ({ request }) => {
  await deleteTestUser(request, suiteUser.id);
});

// ── Module-scope UI helpers (reusable by every test in this file) ──────
//
// The helper performs the login form flow without asserting success, so it
// works for both happy paths and failure paths (e.g. AF-2's suspended-user
// assertion, which expects the failure UI).

async function loginViaUI(page: Page, user: TestUser) {
  // This is the single `page.goto()` for any test that calls this helper.
  await page.goto('/login');
  await expect(page.getByLabel('Email')).toBeVisible();
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.plainPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

async function logoutViaUI(page: Page) {
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByLabel('Email')).toBeVisible(); // back to login screen
}

// ── Tests for UC-001 ────────────────────────────────────────────────────
//
// Inside useCase(), `test` is the imported `@playwright/test` test (not a
// callback parameter), so IDE plugins can run each test from the gutter.

useCase('UC-001', 'Manage Items', () => {

  // MSS: the full happy path as one test — entry point to final outcome.
  test('user logs in, navigates to items, creates item, and sees it in the list',
    meta({ scenario: 'MSS' }),
    async ({ page }) => {
      // 1. Log in (the only page.goto in this test, inside the helper)
      await loginViaUI(page, suiteUser);

      // 2. Navigate to the Items page through the UI — never page.goto('/items')
      await page.getByRole('link', { name: 'Items' }).click();
      await expect(page.getByRole('heading', { name: 'Items' })).toBeVisible();

      // 3. Verify the list screen loaded by waiting for a specific element
      const rows = page.locator('table tbody tr');
      await expect(rows.first()).toBeVisible();

      // 4. Navigate to the create form through the UI
      await page.getByRole('button', { name: 'Add New' }).click();

      // 5. Submit empty to verify validation, then fill and submit again
      await page.getByRole('button', { name: 'Save' }).click();
      // Verifies BR-001: Mandatory Field Validation
      await expect(page.getByText('Name is required')).toBeVisible();

      await page.getByLabel('Name').fill('E2E Test Item');
      await page.getByLabel('Description').fill('Created by E2E test');
      await page.getByRole('button', { name: 'Save' }).click();

      // 6. Verify the final outcome
      // Verifies Success Postcondition: Item Stored and Visible
      await expect(page.locator('table tbody tr')).toContainText(['E2E Test Item']);

      // 7. Log out via UI
      await logoutViaUI(page);

      // Cleanup via API (not navigation — page.request is allowed for I/O).
      const response = await page.request.get('/api/examples?name=E2E+Test+Item');
      const items = await response.json();
      if (items.length > 0) {
        await page.request.delete(`/api/examples/${items[0].id}`);
      }
    });

  // AF-1: alternative flow — empty state.
  test('user logs in, navigates to items, and sees empty state when no items exist',
    meta({ scenario: 'AF-1' }),
    async ({ page }) => {
      // Login first so subsequent page.request calls share the auth cookie.
      await loginViaUI(page, suiteUser);

      // API setup: clear seed data so the empty state is reachable.
      // page.request is API I/O, not navigation — does not count as a goto.
      const list = await page.request.get('/api/examples');
      const allItems = await list.json();
      for (const item of allItems) {
        await page.request.delete(`/api/examples/${item.id}`);
      }

      // Now navigate to Items via UI and assert the empty state
      await page.getByRole('link', { name: 'Items' }).click();
      await expect(page.getByRole('heading', { name: 'Items' })).toBeVisible();
      await expect(page.getByText('No items found')).toBeVisible();

      await logoutViaUI(page);
    });

  // AF-2: per-test user override — suspended user cannot access items.
  // Reuses loginViaUI: the helper just performs the form flow, so it works
  // for both success and failure paths. The test owns the failure assertion.
  test('suspended user sees account-locked screen after login',
    meta({ scenario: 'AF-2' }),
    async ({ page, request }) => {
      const suspendedUser = await createTestUser(request, {
        accountType: 'BUYER',
        status: 'SUSPENDED',
      });

      try {
        // Single page.goto via the helper, even on the failure path.
        await loginViaUI(page, suspendedUser);
        await expect(page.getByText('Account suspended')).toBeVisible();
      } finally {
        // Clean up the per-test user via API even if assertions fail.
        await deleteTestUser(request, suspendedUser.id);
      }
    });

  // AF-3: demonstrates `verifies` (a CR delta on top of UC-001) and `fixes`
  //       (a BUG regression guard) on the same test.
  //   CR-001: add a Category field to the item form, surface it in the list.
  //   BUG-001: submitting the form with an empty Category previously crashed
  //            the API with a 500; post-fix it must surface a validation error.
  test('user creates a categorized item; empty Category is rejected',
    meta({ scenario: 'AF-3', verifies: ['CR-001'], fixes: ['BUG-001'] }),
    async ({ page }) => {
      await loginViaUI(page, suiteUser);

      await page.getByRole('link', { name: 'Items' }).click();
      await page.getByRole('button', { name: 'Add New' }).click();

      await page.getByLabel('Name').fill('CR-Widget');
      await page.getByLabel('Description').fill('Item with a category');

      // BUG-001 regression guard: empty Category must show validation, not crash.
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.getByText(/category is required/i)).toBeVisible();

      // CR-001: fill the new Category field.
      await page.getByLabel('Category').selectOption('hardware');
      await page.getByRole('button', { name: 'Save' }).click();

      // Verifies CR-001: list now displays category alongside name.
      await expect(page.locator('table tbody tr')).toContainText(['CR-Widget', 'hardware']);

      await logoutViaUI(page);

      // API cleanup — not navigation.
      const response = await page.request.get('/api/examples?name=CR-Widget');
      const items = await response.json();
      if (items.length > 0) {
        await page.request.delete(`/api/examples/${items[0].id}`);
      }
    });
});

// ── Pure bug regression — no clean UC home ──────────────────────────────
//
// Use bug() when a bug has no natural use-case scenario to attach to —
// typically infrastructure or cross-cutting bugs (auth crash on unusual
// input, timezone bugs, concurrency races). In real projects, these tests
// live in their own `bug-NNN-<slug>.spec.ts` files; they share this file
// only to keep the example self-contained.

test('login does not crash on Unicode characters in email',
  bug('BUG-002'),
  async ({ page }) => {
    // This test exercises the login form's input handling itself, so it owns
    // its single page.goto rather than calling loginViaUI — the helper requires
    // a real TestUser, which we don't need (the credentials are deliberately
    // invalid; we're testing that the server doesn't 500 on Unicode input).
    await page.goto('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
    await page.getByLabel('Email').fill('üser@example.com');
    await page.getByLabel('Password').fill('does-not-matter');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Pre-fix: server returned 500. Post-fix: friendly invalid-credentials.
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });
