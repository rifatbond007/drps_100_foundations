'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { CircleAlert, Lock } from 'lucide-react';
import type { DonationPurpose, DonationStatus } from '@/types/donation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { LoadError } from '@/components/ui/load-error';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import { formatBDT, toAppLocale } from '@/lib/format';
import { apiErrorKey } from '@/lib/i18n/error-message';
import { submitTrxSchema } from '@/lib/validation/donation';
import { BkashInstructions } from './bkash-instructions';
import { donationReference } from './reference';

interface DonationSummary {
  id: string;
  amount: string;
  purpose: DonationPurpose;
  status: DonationStatus;
  trxId: string | null;
}

export function TrxForm({
  donationId,
  receiverNumber,
}: {
  donationId: string;
  receiverNumber: string;
}) {
  const locale = toAppLocale(useLocale());
  const router = useRouter();
  const t = useTranslations('donation.submit');
  const tRoot = useTranslations();

  const [donation, setDonation] = useState<DonationSummary | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [trxId, setTrxId] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ trxId?: string; senderPhone?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingUrl = `/${locale}/donate/pending?id=${donationId}`;

  useEffect(() => {
    let cancelled = false;
    setLoadFailed(false);
    apiClient
      .get<{ donation: DonationSummary }>(`/donations/${donationId}`)
      .then(({ donation: d }) => {
        if (cancelled) return;
        // Already submitted: nothing left to do on this page.
        if (d.trxId) router.replace(pendingUrl);
        else setDonation(d);
      })
      .catch(() => !cancelled && setLoadFailed(true));
    return () => {
      cancelled = true;
    };
  }, [donationId, pendingUrl, router, attempt]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = submitTrxSchema.safeParse({ trxId, senderPhone });
    if (!parsed.success) {
      const issues = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        trxId: issues.trxId ? t('invalidTrx') : undefined,
        senderPhone: issues.senderPhone ? t('invalidPhone') : undefined,
      });
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post(`/donations/${donationId}/submit-trx`, parsed.data);
      router.push(pendingUrl);
    } catch (err) {
      setError(tRoot(apiErrorKey(err)));
      setSubmitting(false);
    }
  };

  if (loadFailed)
    return <LoadError message={t('loadFailed')} onRetry={() => setAttempt((n) => n + 1)} />;
  if (!donation) return <Skeleton className="h-96 w-full rounded-lg" />;

  return (
    <div className="flex flex-col gap-6">
      <BkashInstructions
        receiverNumber={receiverNumber}
        amount={formatBDT(donation.amount, locale)}
        reference={donationReference(donation.id)}
      />
      <Card className="p-5 sm:p-6">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <Field
            label={t('trxLabel')}
            htmlFor="trxId"
            error={fieldErrors.trxId}
            hint={t('trxHelp')}
          >
            <Input
              id="trxId"
              value={trxId}
              autoComplete="off"
              autoCapitalize="characters"
              placeholder={t('trxPlaceholder')}
              className="tabular uppercase"
              onChange={(e) => setTrxId(e.target.value.trim())}
            />
          </Field>
          <Field
            label={t('phoneLabel')}
            htmlFor="senderPhone"
            error={fieldErrors.senderPhone}
            hint={t('phoneHelp')}
          >
            <Input
              id="senderPhone"
              value={senderPhone}
              inputMode="tel"
              autoComplete="tel"
              placeholder={t('phonePlaceholder')}
              className="tabular"
              onChange={(e) => setSenderPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11))}
            />
          </Field>
          {error && (
            <p
              role="alert"
              className="flex gap-2 rounded-md bg-destructive-soft p-3 text-sm text-destructive"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              {error}
            </p>
          )}
          <Button type="submit" variant="bkash" size="lg" loading={submitting}>
            {t('submit')}
          </Button>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Lock className="size-3.5 shrink-0" aria-hidden />
            {t('reviewNote')}
          </p>
        </form>
      </Card>
    </div>
  );
}
