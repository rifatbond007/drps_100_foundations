import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Button } from '@/components/ui/button';

export default async function DonateSuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('donation.success');

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-8 w-8"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
      <p className="text-muted-foreground">{t('subtitle')}</p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href={`/${locale}/history`}>{t('viewReceipt')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/${locale}/dashboard`}>{t('backToDashboard')}</Link>
        </Button>
      </div>
    </div>
  );
}