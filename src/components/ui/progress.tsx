'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

interface ProgressProps {
  /** 0–100; out-of-range values are clamped. */
  value: number;
  label?: string;
  className?: string;
}

export function Progress({ value, label, className }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <ProgressPrimitive.Root
      value={clamped}
      aria-label={label}
      aria-valuenow={clamped}
      className={cn('relative h-2.5 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <ProgressPrimitive.Indicator
        className="h-full origin-left animate-progress-fill rounded-full bg-primary"
        style={{ width: `${clamped}%` }}
      />
    </ProgressPrimitive.Root>
  );
}
