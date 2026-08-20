import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
  test('landing page loads in Bangla (default locale)', async ({ page }) => {
    await page.goto('/bn');
    await expect(page).toHaveTitle(/Donation Platform/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('English locale loads', async ({ page }) => {
    await page.goto('/en');
    await expect(page).toHaveTitle(/Donation Platform/);
  });

  test('about page renders', async ({ page }) => {
    await page.goto('/en/about');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('login page shows Google sign in', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page.getByRole('button', { name: /Google/i })).toBeVisible();
  });

  test('authenticated route redirects to login', async ({ page }) => {
    const response = await page.goto('/en/dashboard');
    // Either redirected to login or shows login button
    expect(response?.status() ?? 200).toBeLessThan(500);
    await expect(page).toHaveURL(/\/(en|bn)\/login/);
  });

  test('admin route blocks non-admin', async ({ page }) => {
    await page.goto('/en/admin/users');
    // Should not 500; should redirect to login or dashboard
    await expect(page).not.toHaveURL(/\/admin\/users$/);
  });

  test('health endpoint responds', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toMatch(/^(ok|degraded)$/);
    expect(body.timestamp).toBeTruthy();
  });

  test('deep health endpoint checks services', async ({ request }) => {
    const res = await request.get('/api/health?deep=1');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.services).toBeDefined();
    expect(body.services.postgres).toBeDefined();
    expect(body.services.redis).toBeDefined();
  });

  test('404 page renders', async ({ page }) => {
    const response = await page.goto('/en/this-does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.getByText(/404|not found/i)).toBeVisible();
  });
});