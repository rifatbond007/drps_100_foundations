import { setRequestLocale, getTranslations } from 'next-intl/server';
import { DonationsReviewTable } from '@/components/admin/DonationsReviewTable';

/**
 * /admin/donations — review queue for manually-submitted bKash TrxIDs.
 * The page just hosts the table component; the table handles its own
 * header + filter row.
 */
export default async function AdminDonationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.donations');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>
      <DonationsReviewTable />
    </div>
  );
}
