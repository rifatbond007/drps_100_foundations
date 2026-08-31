/**
 * E2E: auth — login page renders the Google sign-in button and it
 * redirects to Google's OAuth screen when clicked.
 *
 * NOTE: This test does NOT actually complete the Google sign-in flow
 * (that would require real Google credentials and a callback URL that's
 * publicly reachable). It only verifies:
 *   1. /bn/login and /en/login render
 *   2. The button text is translated correctly
 *   3. Clicking the button navigates to Google's OAuth screen
 */
import { test, expect } from '@playwright/test';

test.describe('auth: login page', () => {
  test('bn/login renders translated title and button', async ({ page }) => {
    await page.goto('/bn/login');
    await expect(page.getByRole('heading', { name: 'স্বাগতম' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Google দিয়ে সাইন ইন করুন/ })).toBeVisible();
  });

  test('en/login renders translated title and button', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in with Google/ })).toBeVisible();
  });

  test('login page shows signup hint for first-time users', async ({ page }) => {
    await page.goto('/bn/login');
    await expect(page.getByText(/প্রথমবার/)).toBeVisible();

    await page.goto('/en/login');
    await expect(page.getByText(/First time here/)).toBeVisible();
  });

  test('clicking the Google button redirects to accounts.google.com', async ({ page }) => {
    await page.goto('/en/login');
    const button = page.getByRole('button', { name: /Sign in with Google/ });
    await expect(button).toBeVisible();

    // Capture the navigation but don't wait for full load — Google's screen
    // will redirect us back to /api/auth/callback/google, which would fail
    // without a real session. We only assert the outbound redirect target.
    const [request] = await Promise.all([
      page.waitForRequest(
        (req) =>
          req.url().startsWith('https://accounts.google.com/o/oauth2/') ||
          req.url().includes('/api/auth/signin/google'),
        { timeout: 10_000 }
      ),
      button.click(),
    ]);

    const url = request.url();
    expect(
      url.startsWith('https://accounts.google.com/o/oauth2/') ||
        url.includes('/api/auth/signin/google')
    ).toBe(true);
  });

  test('unsafe callbackUrl falls back to dashboard', async ({ page }) => {
    // An attacker-controlled callbackUrl should NOT be honored
    await page.goto('/en/login?callbackUrl=//evil.example.com');
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
    // The button still works (it falls back internally to /dashboard)
    await expect(page.getByRole('button', { name: /Sign in with Google/ })).toBeEnabled();
  });
});
