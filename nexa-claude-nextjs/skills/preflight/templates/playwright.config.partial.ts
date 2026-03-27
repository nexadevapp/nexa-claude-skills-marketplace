/**
 * webServer configuration for playwright.config.ts
 *
 * Copy this into your playwright.config.ts to ensure the dev server
 * is properly managed during test runs.
 *
 * Key settings:
 * - reuseExistingServer: true — Uses running server if available (faster local dev)
 * - timeout: 120000 — 2 minute timeout for server startup (handles slow cold starts)
 * - stdout/stderr: 'pipe' — Captures output for debugging startup failures
 */

import { defineConfig } from '@playwright/test';

export default defineConfig({
  // ... other config

  webServer: {
    /**
     * Command to start the dev server.
     * Use 'npm run dev' for development, 'npm run start' for production build.
     */
    command: 'npm run dev',

    /**
     * URL to poll for server readiness.
     * Change port if your app uses a different one.
     */
    url: 'http://localhost:3000',

    /**
     * How long to wait for the server to start.
     * 2 minutes handles slow cold starts with compilation.
     */
    timeout: 120 * 1000,

    /**
     * If true, reuse an already-running server instead of starting a new one.
     * Set to true for faster local development iteration.
     * Set to false in CI for clean test runs.
     */
    reuseExistingServer: !process.env.CI,

    /**
     * Capture server output for debugging startup failures.
     */
    stdout: 'pipe',
    stderr: 'pipe',

    /**
     * Environment variables for the dev server.
     * Ensure DATABASE_URL points to your test database.
     */
    env: {
      NODE_ENV: 'test',
      // DATABASE_URL is inherited from process.env or .env.test
    },
  },

  // ... other config
});
