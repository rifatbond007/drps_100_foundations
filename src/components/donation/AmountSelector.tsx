/**
 * Donation amount selector.
 * SKELETON — fleshed out by frontend-agent/payment-agent.
 */
'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const PRESETS = [100, 500, 1000, 5000] as const;

interface Props {
  value: number | null;
  onChange: (amount: number) => void;
}

export function AmountSelector({ value, onChange }: Props) {
  const t = useTranslations('donation');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => onChange(amount)}
            className={cn(
              'rounded-md border-2 py-3 text-sm font-medium transition-colors',
              value === amount
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input hover:border-primary/50'
            )}
            aria-pressed={value === amount}
          >
            ৳{amount.toLocaleString()}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <label htmlFor="custom-amount" className="text-sm font-medium">
          {t('customAmount')}
        </label>
        <input
          id="custom-amount"
          type="number"
          min={10}
          max={100000}
          placeholder={t('customAmount')}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v) && v >= 10) onChange(v);
          }}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
