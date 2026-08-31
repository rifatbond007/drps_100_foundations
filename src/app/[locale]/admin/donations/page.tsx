import { setRequestLocale, getTranslations } from 'next-intl/server';
import { DonationsReviewTable } from '@/components/admin/DonationsReviewTable';

/**
 * /admin/donations — review queue for manually-submitted bKash TrxIDs.
 *
 * Layout decision: no h1 here on purpose. The admin sidebar already
 * shows the active page, and the table's own "Donation review" title
 * (sourced from the admin.donations i18n namespace and rendered by the
 * browser via t()) sits above the filter row. Two competing titles
 * would be visual noise.
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>
      <DonationsReviewTable />
    </div>
  );
}
