/**
 * E2E Test User Helper
 *
 * Provisions and cleans up test users via the /api/e2e/users endpoint.
 * Copy this file to e2e/helpers/test-user.ts in your project.
 */
import type { APIRequestContext } from '@playwright/test';

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
 * The API handles bcrypt hashing — we send the plaintext password and get
 * back the created user. The plaintext is kept for UI login.
 */
export async function createTestUser(
  request: APIRequestContext,
  options: CreateTestUserOptions = {},
): Promise<TestUser> {
  const plainPassword = `E2ePass!${randomChars(8)}`;
  const email = `e2e-${randomChars(8)}@example.com`;

  const response = await request.post('/api/e2e/users', {
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
  const response = await request.delete(`/api/e2e/users/${userId}`);

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to delete test user ${userId}: ${response.status()} ${body}`);
  }
}
