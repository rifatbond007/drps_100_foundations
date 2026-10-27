import { test, expect } from '@playwright/test';
import en from '../../messages/en.json';

test('login page stays put and offers Google sign-in', async ({ page }) => {
  await page.goto('/en/login?callbackUrl=%2Fen%2Fdonate');
  await expect(page).toHaveURL(/\/en\/login/);
  await expect(page.getByRole('button', { name: en.auth.loginWithGoogle })).toBeVisible();
});

test('NextAuth errors are shown on the login page', async ({ page }) => {
  await page.goto('/en/login?error=OAuthCallback');
  await expect(page.getByRole('alert')).toContainText(en.auth.errors.oauthCallback);
});
