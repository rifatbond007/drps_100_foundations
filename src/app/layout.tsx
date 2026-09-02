import type { Metadata, Viewport } from 'next';
import { Hind_Siliguri } from 'next/font/google';
import './globals.css';

/*
 * Hind Siliguri — one font family that covers Latin + Bengali glyphs in
 * a single font file. Replaces the previous Inter + Noto_Sans_Bengali
 * combo (two families meant the body had to declare font fallbacks per
 * locale, which made headings re-flow when switching languages).
 *
 * Weight range 400/500/600/700 covers body, emphasis, headings, and the
 * occasional bold data label without us having to round to a non-existent
 * intermediate weight.
 */
const hind = Hind_Siliguri({
  subsets: ['latin', 'bengali'],
  variable: '--font-hind',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'দান প্ল্যাটফর্ম',
    template: '%s | দান প্ল্যাটফর্ম',
  },
  description: 'DRPS Batch-19 Foundation — secure, transparent donations.',
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    siteName: 'দান প্ল্যাটফর্ম',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FBF9F4' },
    { media: '(prefers-color-scheme: dark)', color: '#0E1B17' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={hind.variable} suppressHydrationWarning>
      {/* No h-[100dvh] lock. The page scrolls naturally; long pages
       * (history, settings, reports) get the full document scrollbar
       * instead of a nested 90vh column. */}
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
