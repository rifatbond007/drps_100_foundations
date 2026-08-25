import { setRequestLocale } from 'next-intl/server';
import { ReportsPanel } from '@/components/admin/ReportsPanel';

/**
 * /admin/reports — donation analytics.
 *
 * No h1 / subtitle here: total stats live in the layout's stat card row
 * above all admin pages, so this page just hosts the visualizations
 * (by-purpose bar + by-month line) and the CSV export.
 */
export default async function AdminReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ReportsPanel />;
}
