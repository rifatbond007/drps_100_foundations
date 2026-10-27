import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

/** Radio group rendered as selectable cards. */
export function OptionCards<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map(({ value: v, label, icon: Icon }) => (
          <label
            key={v}
            className={cn(
              'flex cursor-pointer items-center gap-2.5 rounded-md border px-4 py-3 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
              value === v
                ? 'border-primary bg-primary-soft text-primary-soft-foreground'
                : 'hover:border-primary/50'
            )}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={value === v}
              onChange={() => onChange(v)}
            />
            {Icon && <Icon className="size-4" aria-hidden />}
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
