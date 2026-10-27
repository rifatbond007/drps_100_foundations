'use client';

import { signIn } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';

interface SignInButtonProps extends Pick<ButtonProps, 'variant' | 'size' | 'className'> {
  callbackUrl?: string;
  label?: string;
}

/** Starts Google sign-in and returns to `callbackUrl` (default: dashboard). */
export function SignInButton({
  callbackUrl,
  label,
  variant = 'ghost',
  size,
  className,
}: SignInButtonProps) {
  const locale = useLocale();
  const t = useTranslations('nav');
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      loading={pending}
      onClick={() => {
        setPending(true);
        void signIn('google', { callbackUrl: callbackUrl ?? `/${locale}/dashboard` });
      }}
    >
      {label ?? t('login')}
    </Button>
  );
}
