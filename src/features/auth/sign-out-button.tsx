'use client';

import { signOut } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';

type SignOutButtonProps = Pick<ButtonProps, 'variant' | 'size' | 'className'>;

export function SignOutButton({ variant = 'ghost', size, className }: SignOutButtonProps) {
  const locale = useLocale();
  const t = useTranslations('nav');
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => void signOut({ callbackUrl: `/${locale}` })}
    >
      <LogOut aria-hidden />
      {t('logout')}
    </Button>
  );
}
