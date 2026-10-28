import * as React from 'react';
import { Label } from './label';
import { cn } from '@/lib/utils';

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactElement<Record<string, unknown>>;
}

/** Label + control + hint/error, with the control wired to its messages. */
export function Field({ label, htmlFor, error, hint, className, children }: FieldProps) {
  const messageId = `${htmlFor}-message`;
  const message = error ?? hint;
  const control = React.cloneElement(children, {
    'aria-describedby': message ? messageId : undefined,
    'aria-invalid': error ? true : undefined,
  });
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {control}
      {message && (
        <p
          id={messageId}
          className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}
        >
          {message}
        </p>
      )}
    </div>
  );
}
