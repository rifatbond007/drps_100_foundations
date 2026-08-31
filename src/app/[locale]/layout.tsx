import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Providers } from '@/components/layout/Providers';
import { locales, isLocale } from '@/lib/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: {
    default: 'Donation Platform',
    template: '%s | Donation Platform',
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Enables static rendering for this locale.
  setRequestLocale(locale);

  const messages = await getMessages();
  const direction = locale === 'bn' ? 'ltr' : 'ltr'; // both LTR; reserved for RTL locales

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      {/*
        Body is locked to exactly 100dvh (not min-h-) so the page never
        scrolls itself. Header + Footer occupy ~10vh combined and stay
        pinned; <main> is exactly 90vh and is the only scrollable surface.

        100vh = 90vh (main) + 10vh (header + footer). On a 1080px viewport
        that's ~972px content, ~64px header, ~44px footer. The content
        area scrolls internally when pages are taller than 90vh (e.g.
        settings, history lists) — the navbar and footer stay put.
      */}
      <body className="flex h-[100dvh] flex-col overflow-hidden bg-background font-sans antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>
            <Header locale={locale} />
            <main className="h-[90vh] min-h-0 flex-1 overflow-y-auto">{children}</main>
            <Footer locale={locale} />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
