import { test, expect } from '@playwright/test';

const PROTECTED = ['/en/dashboard', '/bn/history', '/en/donate?purpose=MEDICAL', '/en/admin/users'];

for (const path of PROTECTED) {
  test(`signed-out visit to ${path} goes to login with a callbackUrl`, async ({ page }) => {
    await page.goto(path);
    const url = new URL(page.url());
    expect(url.pathname).toMatch(/^\/(en|bn)\/login$/);
    expect(url.searchParams.get('callbackUrl')).toBe(path);
  });
}
