import { setRequestLocale } from 'next-intl/server';

/**
 * Layout for public (unauthenticated) routes — login, about.
 * Wraps with locale context; no auth guard required.
 */
export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <>{children}</>;
}
