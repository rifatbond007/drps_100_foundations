/**
 * /donate/submit — donor lands here after /donate created the PENDING
 * donation row.
 *
 * Single bKash-coloured surface:
 *   - The number to send to sits in a pink-tinted band — donors recognise
 *     bKash pink on sight.
 *   - The four-step instruction list reads as one paragraph, not as
 *     stacked numbered cards.
 *   - The TrxID + sender phone form is hairline-divided from the
 *     instructions, no card chrome.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api/client';
import { ApiClientError } from '@/lib/api/errors';
import { formatBDT } from '@/lib/utils';
import { PAYMENT_INSTRUCTIONS } from '@/lib/payment';

interface DonationSummary {
  id: string;
  amount: string;
  currency: string;
  purpose: string;
  status: string;
  trxId?: string | null;
}

export default function SubmitTrxPage() {
  const t = useTranslations('donation.submit');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const donationId = params.get('id');

  const [donation, setDonation] = useState<DonationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [trxId, setTrxId] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!donationId) {
      setLoadError(tCommon('error'));
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await apiClient.get<{ donation: DonationSummary }>(
          `/donations/${donationId}`
        );
        if (cancelled) return;
        if (result.donation.trxId) {
          router.replace(`/${locale}/donate/pending?id=${donationId}`);
          return;
        }
        setDonation(result.donation);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof ApiClientError ? e.message : 'Could not load donation');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [donationId, locale, router, tCommon]);

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(PAYMENT_INSTRUCTIONS.number);
    } catch {
      // Clipboard may be unavailable (insecure context, no permission).
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await apiClient.post<{ redirectUrl: string }>(
        `/donations/${donationId}/submit-trx`,
        { trxId: trxId.trim(), senderPhone: senderPhone.trim() }
      );
      router.push(res.redirectUrl);
    } catch (e) {
      setSubmitError(e instanceof ApiClientError ? e.message : 'Submission failed');
      setSubmitting(false);
    }
  };

  if (!donationId) {
    return <p className="py-16 text-center text-muted-foreground">{tCommon('error')}</p>;
  }

  return (
    <div className="mx-auto max-w-xl py-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      {loading && (
        <p className="py-8 text-center text-sm text-muted-foreground">{tCommon('loading')}</p>
      )}

      {loadError && !loading && (
        <p
          role="alert"
          className="border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {loadError}
        </p>
      )}

      {donation && !loading && !loadError && (
        <>
          {/* Summary */}
          <dl className="mb-4 flex items-baseline justify-between border-y border-border py-3 text-sm">
            <dt className="text-muted-foreground">{t('amount')}</dt>
            <dd className="text-2xl font-bold tabular-nums">
              {formatBDT(donation.amount, (locale === 'en' ? 'en' : 'bn') as 'bn' | 'en')}
            </dd>
          </dl>

          {/* bKash instruction band. Pink is reserved for payment surfaces
           * — this is the only place it appears. */}
          <section className="border-l-4 border-bkash bg-bkash/5 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">{t('instructionsHeader')}</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-foreground/90">
              <li>{t('step1', { method: PAYMENT_INSTRUCTIONS.method })}</li>
              <li className="flex flex-wrap items-baseline gap-2">
                <span>
                  {t.rich('step2', {
                    number: PAYMENT_INSTRUCTIONS.number,
                    b: (chunks) => <strong className="font-bold tabular-nums">{chunks}</strong>,
                  })}
                </span>
                <button
                  type="button"
                  onClick={copyNumber}
                  className="inline-flex items-center text-xs font-medium text-bkash hover:underline"
                  aria-label={t('copy')}
                >
                  <Copy className="mr-1 h-3 w-3" />
                  {t('copy')}
                </button>
              </li>
              <li>{t('step3', { hint: PAYMENT_INSTRUCTIONS.referenceHint })}</li>
              <li>{t('step4')}</li>
            </ol>
          </section>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trxId">{t('trxLabel')}</Label>
              <Input
                id="trxId"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                placeholder={t('trxPlaceholder')}
                autoComplete="off"
                required
                minLength={6}
                maxLength={40}
              />
              <p className="text-xs text-muted-foreground">{t('trxHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senderPhone">{t('phoneLabel')}</Label>
              <Input
                id="senderPhone"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder={t('phonePlaceholder')}
                inputMode="numeric"
                pattern="^01[3-9]\d{8}$"
                required
              />
              <p className="text-xs text-muted-foreground">{t('phoneHelp')}</p>
            </div>

            {submitError && (
              <p
                role="alert"
                className="border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || trxId.trim().length < 6 || senderPhone.trim().length < 11}
              className="inline-flex h-12 w-full items-center justify-center bg-bkash px-6 text-base font-semibold text-bkash-foreground transition-colors hover:bg-bkash/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {submitting ? tCommon('loading') : t('submit')}
            </button>

            <p className="text-xs text-muted-foreground">{t('reviewNote')}</p>
          </form>
        </>
      )}
    </div>
  );
}
