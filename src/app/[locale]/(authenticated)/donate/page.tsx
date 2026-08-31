'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AmountSelector } from '@/components/donation/AmountSelector';
import { DonationHistoryList } from '@/components/donation/DonationHistoryList';
import { useAuth } from '@/lib/hooks/use-auth';
import { apiClient } from '@/lib/api/client';
import { ApiClientError } from '@/lib/api/errors';

/**
 * Donate page (client component).
 *
 * Manual bKash flow:
 *   1. User picks an amount + purpose
 *   2. Submit → POST /api/donations/create (auth + idempotency)
 *   3. Response carries donationId + nextStep: "submit-trx"
 *   4. Redirect to /donate/submit?id=<donationId> with payment instructions
 *
 * Admins are redirected to /admin/users (role guard is also enforced
 * server-side at /api/donations/create as defense in depth).
 *
 * Profile completion is intentionally NOT required to donate — users can
 * edit or finish their profile at any time from /settings.
 */
export default function DonatePage() {
  const t = useTranslations('donation');
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  const [amount, setAmount] = useState<number | null>(null);
  const [purpose, setPurpose] = useState<string>('GENERAL_FUND');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect admins away from the donate flow as soon as we know who
  // they are.
  useEffect(() => {
    if (isLoading) return;
    if (user?.role === 'ADMIN') {
      router.replace(`/${locale}/admin/users`);
    }
  }, [user, isLoading, locale, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setSubmitting(true);
    setError(null);
    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await apiClient.post<{
        donationId: string;
        paymentMethod: string;
        nextStep: 'submit-trx';
      }>('/donations/create', {
        amount,
        purpose,
        isAnonymous: false,
        idempotencyKey,
      });
      router.push(`/${locale}/donate/submit?id=${res.donationId}`);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Could not start donation');
      setSubmitting(false);
    }
  };

  if (user?.role === 'ADMIN') return null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <AmountSelector value={amount} onChange={setAmount} />

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('purpose')}</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="GENERAL_FUND">{t('purposes.GENERAL_FUND')}</option>
                <option value="EDUCATION">{t('purposes.EDUCATION')}</option>
                <option value="MEDICAL">{t('purposes.MEDICAL')}</option>
                <option value="EMERGENCY">{t('purposes.EMERGENCY')}</option>
              </select>
            </div>

            <Button type="submit" disabled={!amount || submitting} className="w-full">
              {submitting ? t('processing') : t('submit')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('recentDonations')}</CardTitle>
        </CardHeader>
        <CardContent>{user ? <DonationHistoryList userId={user.id} /> : null}</CardContent>
      </Card>
    </div>
  );
}
