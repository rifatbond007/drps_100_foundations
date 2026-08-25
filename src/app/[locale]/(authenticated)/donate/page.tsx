'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AmountSelector } from '@/components/donation/AmountSelector';
import { DonationHistoryList } from '@/components/donation/DonationHistoryList';
import { useAuth } from '@/lib/hooks/use-auth';

/**
 * Donate page (client component).
 * SKELETON — payment-agent will wire to /api/donations/create + bKash flow.
 */
export default function DonatePage() {
  const t = useTranslations('donation');
  const { user } = useAuth();
  const [amount, setAmount] = useState<number | null>(null);
  const [purpose, setPurpose] = useState<string>('GENERAL_FUND');
  const [submitting, setSubmitting] = useState(false);

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
        <CardContent>
          {user ? <DonationHistoryList userId={user.id} /> : null}
        </CardContent>
      </Card>
    </div>
  );
}
