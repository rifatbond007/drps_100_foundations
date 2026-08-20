/**
 * Playwright test fixtures — authenticated user helpers.
 *
 * SKELETON — auth-agent will wire real OAuth flow mocking here.
 */
import type { Page } from '@playwright/test';

export interface TestUser {
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

export const TEST_USERS = {
  regular: {
    email: 'user.test@example.com',
    name: 'Test User',
    role: 'USER' as const,
  },
  admin: {
    email: 'admin.test@example.com',
    name: 'Test Admin',
    role: 'ADMIN' as const,
  },
} as const satisfies Record<string, TestUser>;

/**
 * Sign in by setting the NextAuth session cookie directly.
 * Real implementation should mock the Google OAuth flow.
 */
export async function signInAs(page: Page, user: TestUser = TEST_USERS.regular) {
  // TODO: implement real session cookie injection when auth-agent adds it
  // For now, redirect to login page so tests can verify the auth guard
  await page.goto('/en/login');
}

/**
 * Sign out helper.
 */
export async function signOut(page: Page) {
  await page.goto('/api/auth/signout');
  await page.getByRole('button', { name: /sign out/i }).click();
}
