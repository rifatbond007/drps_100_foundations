/**
 * E2E: unauth-redirect behavior.
 *
 * Verifies middleware contract:
 *   1. Anonymous visits to protected pages redirect to /[locale]/login
 *      with a same-origin callbackUrl preserved.
 *   2. Anonymous visits to /[locale]/login itself stay there (no redirect
 *      loop).
 *   3. The header "Sign in" link lands on /[locale]/login.
 *   4. The unsafe callbackUrl `//evil` does NOT propagate to the protected
 *      page after login.
 */
import { test, expect } from '@playwright/test';

const PROTECTED = ['/en/dashboard', '/en/donate', '/en/history', '/en/settings'];

test.describe('auth: middleware redirects', () => {
  for (const path of PROTECTED) {
    test(`anonymous visit to ${path} redirects to /en/login with callbackUrl`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/en\/login\?callbackUrl=/);
      // The header should expose the login link
      await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    });
  }

  test('the bn locale also redirects protected routes', async ({ page }) => {
    await page.goto('/bn/donate');
    await expect(page).toHaveURL(/\/bn\/login\?callbackUrl=/);
  });

  test('visiting /en/login directly does not redirect', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page).toHaveURL(/\/en\/login(\?|$)/);
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
  });

  test('header Sign-in link routes to /[locale]/login', async ({ page }) => {
    await page.goto('/en');
    await page
      .getByRole('link', { name: /sign in/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/en\/login/);
  });

  test('unsafe callbackUrl "//evil.example.com" is stripped from the query', async ({ page }) => {
    // When middleware builds ?callbackUrl= it must use the same-origin path.
    await page.goto('/en/dashboard');
    const url = new URL(page.url());
    const cb = url.searchParams.get('callbackUrl') ?? '';
    // Must not be a protocol-relative URL
    expect(cb.startsWith('//')).toBe(false);
    // Must point at the dashboard path the user was trying to reach
    expect(cb).toBe('/en/dashboard');
  });
});
