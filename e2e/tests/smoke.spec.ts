import { test, expect } from '@playwright/test';
import bn from '../../messages/bn.json';
import en from '../../messages/en.json';

for (const [locale, messages] of [
  ['bn', bn],
  ['en', en],
] as const) {
  test.describe(`landing (${locale})`, () => {
    test('renders with the right language and a donate CTA', async ({ page }) => {
      const response = await page.goto(`/${locale}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page).toHaveTitle(new RegExp(messages.common.appName));
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(
        page.getByRole('link', { name: messages.landing.donateCta }).first()
      ).toBeVisible();
    });

    test('has no horizontal overflow', async ({ page }) => {
      await page.goto(`/${locale}`);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      expect(overflow).toBe(false);
    });
  });
}

test('about page renders', async ({ page }) => {
  await page.goto('/en/about');
  await expect(page.getByRole('heading', { level: 1, name: en.about.title })).toBeVisible();
});

test('unknown pages show the localized 404', async ({ page }) => {
  const response = await page.goto('/bn/does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: bn.errors.notFoundTitle })).toBeVisible();
});

test('language switcher keeps the current page', async ({ page }) => {
  await page.goto('/bn/about');
  const switcher = page.getByRole('group', { name: bn.a11y.language });
  // Hidden on narrow screens (lives in the mobile menu there).
  test.skip(!(await switcher.isVisible()), 'switcher is in the mobile menu at this width');
  await switcher.getByRole('button', { name: bn.a11y.switchToEn }).click();
  await expect(page).toHaveURL(/\/en\/about$/);
});
