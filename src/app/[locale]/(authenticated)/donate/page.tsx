'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AmountSelector } from '@/components/donation/AmountSelector';
import { DonationHistoryList } from '@/components/donation/DonationHistoryList';
import { useAuth } from '@/lib/hooks/use-auth';

/**
 * Donate page (client component).
 * SKELETON — payment-agent will wire to /api/donations/create + bKash flow.
 *
 * Admins are not allowed to donate — the API route /api/donations/create
 * will reject them with 403 once implemented, and the UI redirects them
 * to the admin users page as a friendlier UX than showing an empty form.
 */
export default function DonatePage() {
  const t = useTranslations('donation');
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const [amount, setAmount] = useState<number | null>(null);
  const [purpose, setPurpose] = useState<string>('GENERAL_FUND');
  const [submitting, setSubmitting] = useState(false);

  // Redirect admins away from the donate flow as soon as we know who they
  // are. Without this, an admin who clicks an old bookmark could submit
  // the form only to be rejected by the (eventually implemented) API.
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
    try {
      // TODO: call /api/donations/create
      // const res = await apiClient.post('/api/donations/create', { amount, purpose, idempotencyKey: crypto.randomUUID() });
      // window.location.href = res.bkashURL;
      // eslint-disable-next-line no-console
      console.warn('donate submit (TODO: implement)', { amount, purpose });
    } finally {
      setSubmitting(false);
    }
  };

  // Don't flash the form for an admin who is being redirected.
  if (user?.role === 'ADMIN') return null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
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
