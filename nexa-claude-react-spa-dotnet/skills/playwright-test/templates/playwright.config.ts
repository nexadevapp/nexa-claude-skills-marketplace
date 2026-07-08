import { defineConfig, devices } from '@playwright/test';

/**
 * Split-stack E2E config: Playwright drives the React SPA (Create React App
 * dev server on :3000) in Chromium; the SPA calls a separate ASP.NET Core API
 * on :5000. Both servers are started and awaited by the `webServer` array.
 *
 * Order of operations Playwright guarantees:
 *   1. globalSetup runs first — starts the Postgres Testcontainer, applies EF
 *      migrations, seeds. It writes the container connection string into
 *      process.env (and .env.e2e is the single source of truth for the rest).
 *   2. Both webServers start (they inherit process.env + source .env.e2e).
 *   3. Tests run once both URLs respond.
 *   4. globalTeardown runs last (Ryuk reaps the container).
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 3 : 6,
  reporter: 'html',
  use: {
    // Navigation happens against the SPA. API I/O in tests uses absolute
    // URLs against the API base (:5000) — see e2e/helpers/test-user.ts.
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      // ASP.NET Core API. `.env.e2e` sets ASPNETCORE_ENVIRONMENT=Test,
      // ConnectionStrings__DefaultConnection (the container), and the JWT secret.
      // --no-launch-profile so launchSettings.json can't override the env.
      command:
        "bash -c 'set -a; source .env.e2e; set +a; exec dotnet run --project src/<Project>.Api --no-launch-profile'",
      // Wait on any 2xx/3xx endpoint the API exposes (health check, or /swagger
      // in Development-style setups). Adjust to a route your API actually serves.
      url: 'http://localhost:5000/health',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      // React SPA. BROWSER=none and CI=true (set in .env.e2e) keep CRA
      // non-interactive and stop it opening a browser tab.
      command: "bash -c 'set -a; source .env.e2e; set +a; exec npm start'",
      url: 'http://localhost:3000',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Do NOT add firefox or webkit — single browser only for E2E
  ],
});
