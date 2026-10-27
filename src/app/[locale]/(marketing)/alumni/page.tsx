import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Users } from 'lucide-react';
import { ComingSoon } from '@/features/content/coming-soon';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'alumni' });
  return { title: t('title') };
}

/** Placeholder until the alumni ships. */
export default async function AlumniPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'alumni' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  return (
    <ComingSoon
      icon={Users}
      badge={tNav('comingSoon')}
      title={t('title')}
      subtitle={t('subtitle')}
      cardTitle={t('comingSoonTitle')}
      cardBody={t('comingSoonBody')}
      homeHref={`/${locale}`}
      homeLabel={tNav('home')}
    />
  );
}
