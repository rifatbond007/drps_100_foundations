import type { Metadata, Viewport } from 'next';
import { Hind_Siliguri } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Providers } from '@/components/layout/providers';
import { locales, isLocale } from '@/lib/i18n/config';

// Hind Siliguri covers Latin and Bengali in one family, so headings don't
// re-flow when switching languages.
const hind = Hind_Siliguri({
  subsets: ['latin', 'bengali'],
  variable: '--font-hind',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  const appName = t('appName');
  return {
    title: { default: appName, template: `%s | ${appName}` },
    description: t('metaDescription'),
    metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
    openGraph: { type: 'website', siteName: appName },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FCFDFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0E1714' },
  ],
  width: 'device-width',
  initialScale: 1,
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

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} className={hind.variable} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-background font-sans antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          {/* Each route group renders its own chrome (site header vs app shell). */}
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
