/**
 * Donate page (client component).
 *
 * Single-screen flow:
 *   1. Amount preset + custom input
 *   2. Purpose selector (a row of chips, not a dropdown)
 *   3. bKash accent CTA
 *
 * Manual bKash flow:
 *   - Submit → POST /api/donations/create (auth + idempotency)
 *   - Response carries donationId + nextStep: "submit-trx"
 *   - Redirect to /donate/submit?id=<donationId>
 *
 * Admins are redirected away as soon as their role is known.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { AmountSelector } from '@/components/donation/AmountSelector';
import { useAuth } from '@/lib/hooks/use-auth';
import { apiClient } from '@/lib/api/client';
import { ApiClientError } from '@/lib/api/errors';
import { cn } from '@/lib/utils';

const PURPOSES = ['GENERAL_FUND', 'EDUCATION', 'MEDICAL', 'EMERGENCY'] as const;
type Purpose = (typeof PURPOSES)[number];

export default function DonatePage() {
  const t = useTranslations('donation');
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  const [amount, setAmount] = useState<number | null>(null);
  const [purpose, setPurpose] = useState<Purpose>('GENERAL_FUND');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="mx-auto max-w-xl py-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
      </header>

      {error && (
        <p
          role="alert"
          className="mb-4 border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('amountLabel')}
          </h2>
          <AmountSelector value={amount} onChange={setAmount} />
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('purpose')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {PURPOSES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPurpose(p)}
                aria-pressed={purpose === p}
                className={cn(
                  'h-9 border px-4 text-sm transition-colors',
                  purpose === p
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:border-foreground'
                )}
              >
                {t(`purposes.${p}`)}
              </button>
            ))}
          </div>
        </section>

        {/* bKash accent CTA — the only pink button on the page. */}
        <button
          type="submit"
          disabled={!amount || submitting}
          className="inline-flex h-12 w-full items-center justify-center bg-bkash px-6 text-base font-semibold text-bkash-foreground transition-colors hover:bg-bkash/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {submitting ? t('processing') : t('submit')}
        </button>
      </form>
    </div>
  );
}
