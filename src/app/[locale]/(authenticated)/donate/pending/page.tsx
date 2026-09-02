import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Button } from '@/components/ui/button';

/**
 * /donate/pending — donor lands here after submitting the bKash TrxID.
 * Server component. The reference + "we'll review within 24 hours"
 * message sit on a single mustard-tinted panel (mustard is reserved
 * for "in progress" states; admin surfaces use it too, but the meaning
 * is consistent: awaiting review).
 */
export default async function DonatePendingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { id } = await searchParams;
  const t = await getTranslations('donation.pending');

  return (
    <div className="mx-auto max-w-md py-12">
      <section className="border-l-4 border-admin bg-admin/5 px-5 py-4">
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-2 text-sm text-foreground/80">{t('subtitle')}</p>
        {id && (
          <p className="mt-3 text-xs text-muted-foreground">
            Reference: <span className="font-mono">{id}</span>
          </p>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href={`/${locale}/history`}>{t('viewHistory')}</Link>
        </Button>
        <Button asChild>
          <Link href={`/${locale}/dashboard`}>{t('backToDashboard')}</Link>
        </Button>
      </div>
    </div>
  );
}
