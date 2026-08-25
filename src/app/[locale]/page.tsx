import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Button } from '@/components/ui/button';

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('landing');

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-8 px-4 py-16 text-center sm:py-24">
      <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
        {t('heroTitle')}
      </h1>
      <p className="max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">
        {t('heroSubtitle')}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href={`/${locale}/donate`}>{t('donateCta')}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href={`/${locale}/about`}>{t('aboutCta')}</Link>
        </Button>
      </div>
    </div>
  );
}
