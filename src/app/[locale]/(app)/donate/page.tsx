import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/next-auth';
import { PageHeader } from '@/components/ui/page-header';
import { DonateForm } from '@/features/donation/donate-form';
import { DonateStepper } from '@/features/donation/donate-stepper';
import { DONATION_PURPOSES } from '@/lib/validation/donation';
import type { DonationPurpose } from '@/types/donation';

export default async function DonatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ purpose?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Admins can't donate (the API refuses too).
  const session = await auth();
  if (session?.user?.role === 'ADMIN') redirect(`/${locale}/admin/dashboard`);

  const { purpose } = await searchParams;
  const initialPurpose = (DONATION_PURPOSES as readonly string[]).includes(purpose ?? '')
    ? (purpose as DonationPurpose)
    : undefined;
  const t = await getTranslations({ locale, namespace: 'donation' });

  return (
    <>
      <PageHeader title={t('title')} description={t('subtitle')} />
      <DonateStepper step={1} />
      <DonateForm initialPurpose={initialPurpose} />
    </>
  );
}
