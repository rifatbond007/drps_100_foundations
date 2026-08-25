/**
 * next-intl configuration.
 *
 * Uses the `await requestLocale` API (next-intl >= 3.22) — the
 * synchronous `locale` parameter is deprecated.
 * See https://next-intl.dev/blog/next-intl-3-22#await-request-locale
 */
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, defaultLocale } from '@/lib/i18n/config';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  if (!requested || !(locales as readonly string[]).includes(requested)) {
    notFound();
  }

  return {
    locale: requested,
    messages: (await import(`../messages/${requested}.json`)).default,
  };
});

export { locales, defaultLocale };
