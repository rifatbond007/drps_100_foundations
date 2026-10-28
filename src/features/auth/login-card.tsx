'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { CircleAlert, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// NextAuth error codes → `auth.errors.*` keys.
const ERROR_KEYS: Record<string, string> = {
  Configuration: 'configuration',
  AccessDenied: 'accessDenied',
  Verification: 'verification',
  OAuthSignin: 'oauthSignin',
  OAuthCallback: 'oauthCallback',
  OAuthCreateAccount: 'oauthCreateAccount',
  OAuthAccountNotLinked: 'oauthAccountNotLinked',
  Callback: 'callback',
};

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export function LoginCard({ callbackUrl, error }: { callbackUrl: string; error?: string }) {
  const t = useTranslations('auth');
  const [pending, setPending] = useState(false);

  return (
    <Card className="w-full max-w-md p-8 text-center shadow-lift sm:p-10">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
        <ShieldCheck className="size-7" aria-hidden />
      </span>
      <h1 className="mt-6 text-2xl font-bold sm:text-3xl">{t('loginTitle')}</h1>
      <p className="mt-2 text-muted-foreground">{t('loginSubtitle')}</p>

      {error && (
        <div
          role="alert"
          className="mt-6 flex gap-3 rounded-md bg-destructive-soft p-4 text-left text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">{t('errorTitle')}</p>
            <p className="mt-0.5">{t(`errors.${ERROR_KEYS[error] ?? 'default'}`)}</p>
          </div>
        </div>
      )}

      <Button
        variant="outline"
        size="lg"
        className="mt-8 w-full"
        loading={pending}
        onClick={() => {
          setPending(true);
          void signIn('google', { callbackUrl });
        }}
      >
        {!pending && <GoogleMark />}
        {t('loginWithGoogle')}
      </Button>
      <p className="mt-4 text-sm text-muted-foreground">{t('signupHint')}</p>
    </Card>
  );
}
