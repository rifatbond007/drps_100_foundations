/**
 * Donation amount selector.
 *
 * Layout: four preset pills in a single row, then a single full-width
 * custom input below. The selected preset uses an emerald border + filled
 * emerald background; unselected pills are hairline-bordered.
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
              'h-11 border text-sm font-semibold tabular-nums transition-colors',
              value === amount
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background hover:border-foreground'
            )}
            aria-pressed={value === amount}
          >
            ৳{amount.toLocaleString()}
          </button>
        ))}
      </div>
      <input
        type="number"
        min={10}
        max={100000}
        placeholder={t('customAmount')}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v) && v >= 10) onChange(v);
        }}
        className="h-11 w-full border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={t('customAmount')}
      />
    </div>
  );
}
