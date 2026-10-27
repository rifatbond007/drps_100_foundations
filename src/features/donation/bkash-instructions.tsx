'use client';

import { useTranslations } from 'next-intl';
import { Copy, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface BkashInstructionsProps {
  receiverNumber: string;
  amount: string;
  reference: string;
}

/** The pink bKash card: where to send, how much, and what reference to use. */
export function BkashInstructions({ receiverNumber, amount, reference }: BkashInstructionsProps) {
  const t = useTranslations('donation.submit');
  const steps = [t('step1'), t('step2', { amount }), t('step3'), t('step4')];

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t('copied'));
    } catch {
      // Clipboard can be unavailable (insecure context); the value is visible anyway.
    }
  };

  return (
    <section className="overflow-hidden rounded-lg border border-bkash/30 bg-bkash-soft">
      <div className="flex items-center gap-3 bg-bkash px-5 py-4 text-bkash-foreground">
        <Smartphone className="size-5" aria-hidden />
        <h2 className="font-semibold">{t('title')}</h2>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-3">
        <CopyField
          label={t('receiverLabel')}
          value={receiverNumber}
          copyLabel={t('copy')}
          onCopy={copy}
        />
        <CopyField label={t('amountLabel')} value={amount} />
        <CopyField
          label={t('referenceLabel')}
          value={reference}
          copyLabel={t('copy')}
          onCopy={copy}
        />
      </div>
      <ol className="space-y-2 border-t border-bkash/20 px-5 py-4 text-sm">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-bkash text-xs font-bold text-bkash-foreground">
              {i + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CopyField({
  label,
  value,
  copyLabel,
  onCopy,
}: {
  label: string;
  value: string;
  copyLabel?: string;
  onCopy?: (value: string) => void;
}) {
  return (
    <div className="rounded-md bg-card p-3 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="tabular truncate text-lg font-bold">{value}</p>
        {onCopy && (
          <button
            type="button"
            onClick={() => onCopy(value)}
            aria-label={`${copyLabel} ${label}`}
            className="rounded-full p-1.5 text-bkash hover:bg-bkash-soft"
          >
            <Copy className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
