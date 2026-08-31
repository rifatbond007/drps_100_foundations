'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Copy, Phone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
}

/**
 * /donate/submit — donor landed here after /donate created the PENDING
 * donation row. Shows the bKash instructions, then collects the TrxID
 * + sender phone via the form.
 *
 * If the donation already has a TrxID (revisit), we jump straight to
 * /donate/pending so the donor doesn't see a form that would 422.
 */
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

  // Load the donation so we can show amount/purpose + jump to /pending
  // if the donor already submitted a TrxID.
  useEffect(() => {
    if (!donationId) {
      setLoadError(tCommon('error'));
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await apiClient.get<{
          donation: DonationSummary & { trxId: string | null };
        }>(`/donations/${donationId}`);
        if (cancelled) return;
        if (result.donation.trxId) {
          // Already submitted — skip the form.
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
      // Not worth blocking the user over.
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
    return (
      <div className="mx-auto max-w-md py-16 text-center text-muted-foreground">
        {tCommon('error')}
      </div>
    );
  }

  return (
    // `h-full` so the card fits the auth layout's content column (90vh
    // minus its own padding). When the form + instructions are taller
    // than that, the inner CardContent scrolls instead of pushing the
    // submit button below the viewport.
    <div className="mx-auto flex h-full max-w-md flex-col gap-3 py-2">
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="shrink-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4" />
            {t('title')}
          </CardTitle>
          <CardDescription className="text-xs">{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="min-h-0 space-y-3 overflow-y-auto pr-2">
          {loading && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {tCommon('loading')}
            </div>
          )}
          {loadError && !loading && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {loadError}
            </div>
          )}
          {donation && !loading && !loadError && (
            <>
              <div className="space-y-1 rounded-md border bg-muted/40 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('amount')}</span>
                  <span className="text-lg font-bold">
                    {formatBDT(donation.amount, (locale === 'en' ? 'en' : 'bn') as 'bn' | 'en')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('purpose')}</span>
                  <span className="font-medium">{donation.purpose}</span>
                </div>
              </div>

              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs">
                <div className="font-semibold text-amber-900">{t('instructionsHeader')}</div>
                <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-amber-900">
                  <li>{t('step1', { method: PAYMENT_INSTRUCTIONS.method })}</li>
                  <li>
                    {t.rich('step2', {
                      number: PAYMENT_INSTRUCTIONS.number,
                      b: (chunks) => <strong className="font-bold tracking-wide">{chunks}</strong>,
                    })}{' '}
                    <button
                      type="button"
                      onClick={copyNumber}
                      className="ml-1 inline-flex items-center text-xs font-medium text-amber-900 underline underline-offset-2 hover:text-amber-700"
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      {t('copy')}
                    </button>
                  </li>
                  <li>{t('step3', { hint: PAYMENT_INSTRUCTIONS.referenceHint })}</li>
                  <li>{t('step4')}</li>
                </ol>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
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
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {submitError}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting || trxId.trim().length < 6 || senderPhone.trim().length < 11}
                  className="w-full"
                >
                  {submitting ? tCommon('loading') : t('submit')}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex shrink-0 items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-2 text-xs text-blue-900">
        <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" />
        <p>{t('reviewNote')}</p>
      </div>
    </div>
  );
}
