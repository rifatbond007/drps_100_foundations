import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ReportsPanel } from '@/components/admin/ReportsPanel';

// Force-dynamic so Next.js never tries to statically cache this route.
export const dynamic = 'force-dynamic';

export default async function AdminReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.reports');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>
      <ReportsPanel />
    </div>
  );
}
