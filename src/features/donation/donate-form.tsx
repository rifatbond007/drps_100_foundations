'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, CircleAlert, ShieldCheck } from 'lucide-react';
import type { DonationPurpose } from '@/types/donation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/client';
import { CAUSES, causeFor } from '@/lib/config/causes';
import { formatBDT, toAppLocale } from '@/lib/format';
import { apiErrorKey } from '@/lib/i18n/error-message';
import { cn } from '@/lib/utils';

const PRESETS = [100, 500, 1000, 2000, 5000] as const;
const MIN = 10;
const MAX = 100_000;

export function DonateForm({
  initialPurpose = 'GENERAL_FUND',
}: {
  initialPurpose?: DonationPurpose;
}) {
  const locale = toAppLocale(useLocale());
  const router = useRouter();
  const t = useTranslations('donation');
  const tLanding = useTranslations('landing');
  const tRoot = useTranslations();

  const [amount, setAmount] = useState<number | null>(null);
  const [custom, setCustom] = useState('');
  const [purpose, setPurpose] = useState<DonationPurpose>(initialPurpose);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One key per visit to this form: a retry after a network error replays
  // the same request instead of creating a second donation.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const amountError =
    amount === null
      ? null
      : amount < MIN
        ? t('errors.minAmount')
        : amount > MAX
          ? t('errors.maxAmount')
          : null;
  const canSubmit = amount !== null && !amountError && !submitting;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.post<{ donationId: string }>('/donations/create', {
        amount,
        purpose,
        isAnonymous: false,
        idempotencyKey,
      });
      router.push(`/${locale}/donate/submit?id=${res.donationId}`);
    } catch (err) {
      setError(tRoot(apiErrorKey(err)));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="flex flex-col gap-6">
        <Card className="p-5 sm:p-6">
          <fieldset>
            <legend className="text-lg font-semibold">{t('amountLabel')}</legend>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {PRESETS.map((value) => (
                <label
                  key={value}
                  className={cn(
                    'tabular flex h-12 cursor-pointer items-center justify-center rounded-md border text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                    amount === value && !custom
                      ? 'border-primary bg-primary-soft text-primary-soft-foreground'
                      : 'hover:border-primary/50'
                  )}
                >
                  <input
                    type="radio"
                    name="amount"
                    className="sr-only"
                    checked={amount === value && !custom}
                    onChange={() => {
                      setAmount(value);
                      setCustom('');
                    }}
                  />
                  {formatBDT(value, locale)}
                </label>
              ))}
            </div>
            <div className="mt-4">
              <label htmlFor="custom-amount" className="text-sm font-medium">
                {t('customAmount')}
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ৳
                </span>
                <Input
                  id="custom-amount"
                  inputMode="numeric"
                  className="pl-8"
                  value={custom}
                  aria-invalid={custom && amountError ? true : undefined}
                  aria-describedby="amount-hint"
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^\d]/g, '').slice(0, 6);
                    setCustom(digits);
                    setAmount(digits ? Number(digits) : null);
                  }}
                />
              </div>
              <p
                id="amount-hint"
                className={cn(
                  'mt-1.5 text-xs',
                  amountError ? 'text-destructive' : 'text-muted-foreground'
                )}
              >
                {amountError ?? t('amountHint')}
              </p>
            </div>
          </fieldset>
        </Card>

        <Card className="p-5 sm:p-6">
          <fieldset>
            <legend className="text-lg font-semibold">{t('purpose')}</legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {CAUSES.map(({ purpose: value, icon: Icon, nameKey, descKey }) => (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer gap-3 rounded-md border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                    purpose === value
                      ? 'border-primary bg-primary-soft/60'
                      : 'hover:border-primary/50'
                  )}
                >
                  <input
                    type="radio"
                    name="purpose"
                    className="sr-only"
                    checked={purpose === value}
                    onChange={() => setPurpose(value)}
                  />
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-card text-primary shadow-sm">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold">{tLanding(nameKey)}</span>
                    <span className="block text-sm text-muted-foreground">{tLanding(descKey)}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </Card>
      </div>

      <Card className="p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">{t('summaryTitle')}</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t('summaryFund')}</dt>
            <dd className="font-medium">{tLanding(causeFor(purpose).nameKey)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t pt-3">
            <dt className="text-muted-foreground">{t('summaryAmount')}</dt>
            <dd className="tabular text-xl font-bold">
              {amount && !amountError ? formatBDT(amount, locale) : '—'}
            </dd>
          </div>
        </dl>
        {error && (
          <p
            role="alert"
            className="mt-4 flex gap-2 rounded-md bg-destructive-soft p-3 text-sm text-destructive"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          className="mt-5 w-full"
          disabled={!canSubmit}
          loading={submitting}
        >
          {t('continue')}
          <ArrowRight aria-hidden />
        </Button>
        <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden />
          {t('secureNote')}
        </p>
      </Card>
    </form>
  );
}
