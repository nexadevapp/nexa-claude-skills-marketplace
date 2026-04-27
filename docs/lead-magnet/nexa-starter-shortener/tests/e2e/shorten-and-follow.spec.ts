// Golden-path E2E covering UC-002 + UC-003 in one journey:
// anonymous visitor shortens a URL, then follows the resulting short link
// and lands on the destination.
//
// Spec: docs/use_cases/UC-002.md, docs/use_cases/UC-003.md

import { test, expect } from "@playwright/test";

test.describe("UC-002 + UC-003 — anonymous shorten and follow", () => {
  test("shortens a URL and the resulting link redirects to the destination", async ({
    page,
    context,
  }) => {
    // Step 1–2 — open the home page.
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Long links/i })).toBeVisible();

    // Step 3 — paste a destination URL.
    const destination = "https://example.com/test-target?from=playwright";
    await page.getByPlaceholder(/example\.com/).fill(destination);

    // Step 5 — submit.
    await page.getByRole("button", { name: /Shorten/i }).click();

    // Step 10 — short URL is displayed. Match the host plus a 7-char slug.
    const result = page.locator("a", { hasText: /\/[a-z0-9]{7}$/ });
    await expect(result).toBeVisible({ timeout: 10_000 });

    const shortUrl = await result.first().getAttribute("href");
    expect(shortUrl).toMatch(/\/[a-z0-9]{7}$/);

    // The result block shows the anonymous expiry pill (NFR-005).
    await expect(page.getByText(/Expires/)).toBeVisible();

    // UC-003 — follow the short link, expect a 302 to the destination.
    const slug = shortUrl!.split("/").pop()!;
    const response = await context.request.get(`/${slug}`, { maxRedirects: 0 });
    expect(response.status()).toBe(302);
    expect(response.headers()["location"]).toBe(destination);
  });

  test("rejects invalid destination URL with inline error (UC-002 A1)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByPlaceholder(/example\.com/).fill("ftp://example.com");
    await page.getByRole("button", { name: /Shorten/i }).click();
    await expect(page.getByText(/valid http or https URL/i)).toBeVisible();
  });

  test("blocked destinations get a generic rejection (UC-002 A2 / BR-04)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByPlaceholder(/example\.com/).fill("https://phishing.example/x");
    await page.getByRole("button", { name: /Shorten/i }).click();
    await expect(page.getByText(/cannot be shortened/i)).toBeVisible();
    // BR-04 — message must NOT name the rule, list, or destination.
    await expect(page.getByText(/phishing/i)).not.toBeVisible();
  });

  test("unknown slug returns 404 (UC-003 A1)", async ({ context }) => {
    const response = await context.request.get("/zzzzzzz", { maxRedirects: 0 });
    expect(response.status()).toBe(404);
    expect(await response.text()).toMatch(/Short link not found/i);
  });
});
