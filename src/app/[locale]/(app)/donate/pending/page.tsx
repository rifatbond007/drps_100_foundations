import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CircleCheck, History, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DonateStepper } from '@/features/donation/donate-stepper';
import { donationReference } from '@/features/donation/reference';

/** Final step: the TrxID is submitted and waiting for an admin. */
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
  const t = await getTranslations({ locale, namespace: 'donation.pending' });

  return (
    <div className="mx-auto max-w-2xl">
      <DonateStepper step={4} />
      <Card className="flex flex-col items-center p-8 text-center sm:p-12">
        <span className="flex size-20 items-center justify-center rounded-full bg-primary-soft text-primary">
          <CircleCheck className="size-10" aria-hidden />
        </span>
        <h1 className="mt-6 text-balance text-2xl font-bold sm:text-3xl">{t('title')}</h1>
        <p className="mt-3 max-w-md text-muted-foreground">{t('subtitle')}</p>
        {id && (
          <p className="mt-6 rounded-full bg-muted px-4 py-1.5 text-sm">
            {t('reference')}: <span className="tabular font-semibold">{donationReference(id)}</span>
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href={`/${locale}/history`}>
              <History aria-hidden />
              {t('viewHistory')}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/${locale}`}>
              <Home aria-hidden />
              {t('backHome')}
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
