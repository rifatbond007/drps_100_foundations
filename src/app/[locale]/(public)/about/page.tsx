import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{t('subtitle')}</p>

      <div className="prose prose-stone mt-8 dark:prose-invert">
        <p>{t('body')}</p>
      </div>
    </div>
  );
}