/**
 * Site footer. Server component.
 */
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const year = new Date().getFullYear();
  const appName = 'Donation Platform';

  return (
    // shrink-0 keeps the footer pinned at the bottom of the 100vh body
    // even when <main> scrolls internally. Without it, the footer would
    // get compressed by the main area's flex-1 sizing.
    <footer className="shrink-0 border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
        <p className="text-sm text-muted-foreground">{t('copyright', { year, appName })}</p>
        <nav className="flex gap-4 text-sm">
          <Link href={`/${locale}/about`} className="hover:underline">
            {t('about')}
          </Link>
          <Link href="/privacy" className="hover:underline">
            {t('privacy')}
          </Link>
          <Link href="/terms" className="hover:underline">
            {t('terms')}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
