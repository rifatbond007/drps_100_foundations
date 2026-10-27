import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft, Construction, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * /[locale]/alumni — placeholder.
 *
 * Full alumni directory (donor/volunteer/org profiles, search, filters)
 * is not built yet. This page is a styled "coming soon" so the navbar
 * link lands somewhere on-brand. When the directory ships, replace the
 * body of this page with the directory view — keep the same Hero-style
 * header so the page transition is seamless.
 */
export default async function AlumniPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('alumni');
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Users className="h-8 w-8" />
      </div>
      <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
        <Construction className="h-3 w-3" />
        {tNav('comingSoon')}
      </span>
      <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
        {t('title')}
      </h1>
      <p className="mt-4 max-w-2xl text-balance text-lg text-muted-foreground">{t('subtitle')}</p>

      <div className="mt-10 rounded-xl border bg-card p-8 text-left shadow-sm">
        <h2 className="text-xl font-semibold">{t('comingSoonTitle')}</h2>
        <p className="mt-3 text-muted-foreground">{t('comingSoonBody')}</p>
      </div>

      <Button asChild variant="ghost" className="mt-10">
        <Link href={`/${locale}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tNav('home')}
        </Link>
      </Button>
    </div>
  );
}
