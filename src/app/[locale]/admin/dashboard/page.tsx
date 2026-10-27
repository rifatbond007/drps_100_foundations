import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/ui/page-header';
import { AdminOverview } from '@/features/admin/admin-overview';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.dashboard' });
  return { title: t('title') };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'admin.dashboard' });
  return (
    <>
      <PageHeader title={t('title')} description={t('subtitle')} />
      <AdminOverview />
    </>
  );
}
