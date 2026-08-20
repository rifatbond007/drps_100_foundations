/**
 * next-intl configuration.
 */
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, defaultLocale } from '@/lib/i18n/config';

export default getRequestConfig(async ({ locale }) => {
  if (!(locales as readonly string[]).includes(locale)) notFound();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

export { locales, defaultLocale };
