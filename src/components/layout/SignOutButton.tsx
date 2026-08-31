'use client';

/**
 * Sign-out button (Auth.js v5).
 * Replaces the v4-era <form action="/api/auth/signout"> pattern.
 *
 * On click: signs out at `/api/auth/signout` and redirects back to the
 * current locale's root (not a hardcoded one). The same-origin guard
 * from `safeCallbackUrl` is applied so a tampered `window.location.pathname`
 * can never bounce sign-out to an external URL.
 */
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { safeCallbackUrl } from '@/lib/utils/safe-callback-url';

interface Props {
  label: string;
}

export function SignOutButton({ label }: Props) {
  const handleClick = () => {
    // Stay on the current locale, don't hardcode "bn".
    // Fallback to "/" covers the case where pathname is empty.
    const target = safeCallbackUrl(
      typeof window !== 'undefined' ? window.location.pathname : '/',
      '/'
    );
    signOut({ callbackUrl: target });
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleClick}>
      {label}
    </Button>
  );
}
