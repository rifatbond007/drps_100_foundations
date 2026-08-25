'use client';

/**
 * /donate/checkout — in-app DUMMY payment gateway.
 *
 * This page stands in for a real bKash / SSLCOMMERZ redirect page.
 * The /api/donations/create endpoint returns a redirectUrl pointing
 * here when the active provider is "dummy". The user sees a faithful
 * look-alike of a real checkout (amount, donor name, Pay / Cancel
 * buttons) and clicking Pay calls /api/donations/[id]/complete to
 * mark the donation SUCCESS and navigate to /donate/success.
 *
 * In production (PAYMENT_PROVIDER=bkash) this route is never reached
 * — the user would be redirected to bkash.com instead.
 */
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { CreditCard, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api/client';
import { ApiClientError } from '@/lib/api/errors';
import { formatBDT } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';
import { useProfile } from '@/lib/hooks/use-profile';

interface DonationSummary {
  id: string;
  amount: string;
  currency: string;
  purpose: string;
  status: string;
}

export default function CheckoutPage() {
  const t = useTranslations('donation.checkout');
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const donationId = params.get('donationId');
  const paymentId = params.get('paymentId');

  const [donation, setDonation] = useState<DonationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch the donation summary for display. We don't have a single-row
  // GET /api/donations/[id] route — use the history endpoint filtered by
  // the donationId is overkill, so we do a one-shot minimal fetch via
  // a lightweight dedicated endpoint. For the dummy flow the create
  // response already carries the donationId; we look up the row via
  // the user's history (paginated to 1 row matching id).
  //
  // Implementation choice: a small client-side fetch via
  //   GET /api/donations/[id]  ->  { donation }
  // We'll add that route right after this page.

  useEffect(() => {
    if (!donationId) {
      setError('Missing donation id');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await apiClient.get<{ donation: DonationSummary }>(
          `/donations/${donationId}`
        );
        if (!cancelled) setDonation(result.donation);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiClientError ? e.message : 'Could not load donation');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [donationId]);

  const onPay = async () => {
    if (!donationId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.post<{ status: string; redirectUrl: string }>(
        `/donations/${donationId}/complete`,
        { status: 'SUCCESS' }
      );
      router.push(res.redirectUrl);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Payment failed');
      setSubmitting(false);
    }
  };

  const onCancel = async () => {
    if (!donationId) {
      router.push(`/${locale}/donate/failed`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.post<{ status: string; redirectUrl: string }>(
        `/donations/${donationId}/complete`,
        { status: 'CANCELLED', failureReason: 'user_cancelled' }
      );
      router.push(res.redirectUrl);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Cancellation failed');
      setSubmitting(false);
    }
  };

  if (!donationId) {
    return (
      <div className="mx-auto max-w-md py-16 text-center text-muted-foreground">
        {t('missingId')}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('title')}
            </CardTitle>
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
              {t('testModeBadge')}
            </span>
          </div>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading && (
            <div className="py-8 text-center text-sm text-muted-foreground">{t('loading')}</div>
          )}
          {error && !loading && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}
          {donation && !loading && !error && (
            <>
              <div className="space-y-2 rounded-md border bg-muted/40 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('amount')}</span>
                  <span className="text-xl font-bold">
                    {formatBDT(donation.amount, (locale === 'en' ? 'en' : 'bn') as 'bn' | 'en')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('donor')}</span>
                  <span className="font-medium">
                    {profile?.name ?? user?.name ?? user?.email ?? '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('purpose')}</span>
                  <span className="font-medium">{donation.purpose}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t('paymentId')}</span>
                  <span className="font-mono">{paymentId ?? donation.id}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{t('testModeNotice')}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={onCancel}
                  variant="outline"
                  disabled={submitting}
                  className="flex-1"
                >
                  <X className="mr-1 h-4 w-4" />
                  {t('cancel')}
                </Button>
                <Button onClick={onPay} disabled={submitting} className="flex-1">
                  {submitting ? t('processing') : t('pay')}
                </Button>
              </div>
            </>
          )}

          {!loading && !donation && !error && (
            <div className="py-8 text-center text-sm text-muted-foreground">{t('notFound')}</div>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        <Link href={`/${locale}/dashboard`} className="hover:underline">
          {t('backToDashboard')}
        </Link>
      </p>
    </div>
  );
}
