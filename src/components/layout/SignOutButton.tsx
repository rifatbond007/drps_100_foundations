'use client';

/**
 * Sign-out button (Auth.js v5).
 * Replaces the v4-era <form action="/api/auth/signout"> pattern.
 */
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

interface Props {
  label: string;
}

export function SignOutButton({ label }: Props) {
  return (
    <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/bn' })}>
      {label}
    </Button>
  );
}
