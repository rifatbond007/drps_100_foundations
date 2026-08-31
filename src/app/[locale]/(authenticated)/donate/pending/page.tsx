import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * /donate/pending — donor lands here after submitting the bKash TrxID.
 *
 * Server component: shows the receipt reference + a clear "we'll
 * review this within 24 hours" message. No client JS needed.
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
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
        <Clock className="h-8 w-8" />
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
        {id && <p className="mt-2 font-mono text-xs text-muted-foreground">Reference: {id}</p>}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
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
