// E2E for UC-001 — Link Owner sees their links.
// Requires the seed data (`bun run db:seed`).
//
// Spec: docs/use_cases/UC-001.md

import { test, expect } from "@playwright/test";

test.describe("UC-001 — List my links", () => {
  test("unauthenticated visitor is redirected to sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("after demo sign-in, the seed user sees their links", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("button", { name: /Sign in as maria/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Loaded state has the page header + at least the seeded slugs.
    await expect(page.getByRole("heading", { name: "My links" })).toBeVisible();
    await expect(page.getByText("launch-2026")).toBeVisible();
    await expect(page.getByRole("link", { name: "cv" })).toBeVisible();
    await expect(page.getByText("talk-london")).toBeVisible();
  });
});
