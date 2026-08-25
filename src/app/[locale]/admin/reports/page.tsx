import { setRequestLocale } from 'next-intl/server';
import { ReportsPanel } from '@/components/admin/ReportsPanel';

// Force-dynamic so Next.js never tries to statically cache this route.
// Combined with the TanStack Query hook inside ReportsPanel
// (staleTime: 0 + refetchOnMount: 'always') this guarantees the
// visualizations reflect new donations the moment they land, even when
// the admin navigates back to /admin/reports from another tab without a
// hard refresh.
export const dynamic = 'force-dynamic';

/**
 * /admin/reports — donation analytics.
 *
 * No h1 / subtitle here: total stats live in /admin/dashboard above all
 * admin pages, so this page just hosts the visualizations (by-purpose
 * bar + by-month line), the manual refresh button, and the CSV export.
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
