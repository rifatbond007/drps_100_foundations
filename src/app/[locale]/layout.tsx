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
        Body is locked to h-screen so the Header + Footer + main area
        always fit in 100vh regardless of page content. The <main>
        region is the only overflow-y-auto surface — Header + Footer
        are shrink-0 sticky/fixed boundaries and never scroll.
      */}
      <body className="flex h-screen flex-col overflow-hidden bg-background font-sans antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>
            <Header locale={locale} />
            <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
            <Footer locale={locale} />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
