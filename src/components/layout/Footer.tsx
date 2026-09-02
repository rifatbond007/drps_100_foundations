/**
 * Site footer. Server component.
 *
 * One line, centered: copyright + secondary links. No row of columns,
 * no newsletter signup, no social icons — the foundation is small and
 * the footer should reflect that. The locale layout pushes it to the
 * bottom of the page via flex-column with `flex-1` on <main>.
 */
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="container flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-6 text-xs text-muted-foreground">
        <span>© {year} DRPS Batch-19 Foundation</span>
        <Link href={`/${locale}/about`} className="hover:text-foreground">
          {t('about')}
        </Link>
        <Link href={`/${locale}/privacy`} className="hover:text-foreground">
          {t('privacy')}
        </Link>
        <Link href={`/${locale}/terms`} className="hover:text-foreground">
          {t('terms')}
        </Link>
      </div>
    </footer>
  );
}
