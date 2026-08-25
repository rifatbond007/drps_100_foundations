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
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
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
