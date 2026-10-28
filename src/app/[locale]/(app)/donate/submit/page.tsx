import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { DonateStepper } from '@/features/donation/donate-stepper';
import { TrxForm } from '@/features/donation/trx-form';
import { BKASH_RECEIVER_NUMBER } from '@/lib/payment';

/**
 * Step 2–3: pay with bKash, then submit the TrxID. Server component so
 * the receiver number comes from server env (it isn't a NEXT_PUBLIC_ var).
 */
export default async function SubmitTrxPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { id } = await searchParams;
  if (!id) redirect(`/${locale}/donate`);
  const t = await getTranslations({ locale, namespace: 'donation.submit' });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t('title')} description={t('subtitle')} />
      <DonateStepper step={2} />
      <TrxForm donationId={id} receiverNumber={BKASH_RECEIVER_NUMBER} />
    </div>
  );
}
