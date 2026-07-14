/**
 * E2E Test User Helper (React SPA + ASP.NET Core split stack)
 *
 * Provisions and cleans up test users via the ASP.NET Core /api/e2e/users
 * endpoint (guarded by ASPNETCORE_ENVIRONMENT=Test). Because the API lives on
 * a DIFFERENT origin than the SPA (baseURL :3000), these calls use ABSOLUTE
 * URLs against the API base — not the Playwright `use.baseURL`.
 *
 * Copy this file to e2e/helpers/test-user.ts in your project.
 */
import type { APIRequestContext } from '@playwright/test';

// API base — same value the SPA uses for REACT_APP_API_BASE_URL. Loaded from
// .env.e2e by global-setup, so it's on process.env when tests run.
const API_BASE = process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:5000';

export interface TestUser {
  id: string;
  email: string;
  plainPassword: string;
  accountType: string;
  status: string;
}

interface CreateTestUserOptions {
  accountType?: string;
  status?: string;
  emailConfirmed?: boolean;
}

function randomChars(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Creates a test user via the E2E API endpoint.
 *
 * The API hashes the password with its REAL password hasher — we send the
 * plaintext and get back the created user. The plaintext is kept for UI login
 * so the same hasher that verifies at login is the one that stored it.
 */
export async function createTestUser(
  request: APIRequestContext,
  options: CreateTestUserOptions = {},
): Promise<TestUser> {
  const plainPassword = `E2ePass!${randomChars(8)}`;
  const email = `e2e-${randomChars(8)}@example.com`;

  const response = await request.post(`${API_BASE}/api/e2e/users`, {
    data: {
      email,
      password: plainPassword,
      accountType: options.accountType ?? 'BUYER',
      status: options.status ?? 'ACTIVE',
      emailConfirmed: options.emailConfirmed ?? true,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to create test user: ${response.status()} ${body}`);
  }

  const user = await response.json();

  return {
    id: user.id,
    email,
    plainPassword,
    accountType: user.accountType ?? user.account_type,
    status: user.status,
  };
}

/**
 * Deletes a test user and all related records via the E2E API endpoint.
 */
export async function deleteTestUser(
  request: APIRequestContext,
  userId: string,
): Promise<void> {
  const response = await request.delete(`${API_BASE}/api/e2e/users/${userId}`);

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to delete test user ${userId}: ${response.status()} ${body}`);
  }
}
