'use client';

/**
 * Login landing page — exists to satisfy NextAuth's `pages.signIn` redirect
 * target. Under normal flow, the header's `SignInButton` invokes
 * `signIn('google')` directly and never visits this page. We only end up
 * here when NextAuth itself redirects — either after a failed OAuth
 * callback (e.g. PKCE mismatch from a dev-server restart) or when an
 * unauthenticated request hits a protected route via deep link.
 *
 * On mount:
 * - If a `?error=` query param is present, render a localized error
 *   banner so the user knows what happened (instead of silently bouncing
 *   to Google and producing a confusing round-trip).
 * - Otherwise, immediately trigger `signIn('google')` so a deep link to
 *   /login behaves identically to clicking the header's Sign in button.
 *
 * Auth-free by design: middleware's `isAuthFreePath` whitelist must
 * include `/{locale}/login` — otherwise an unauthenticated visitor would
 * be redirected away before this page could render.
 */
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

// Maps NextAuth error codes to translation keys under the `auth.errors.*`
// namespace. Unknown codes fall back to `auth.errors.default`.
const ERROR_KEYS: Record<string, string> = {
  Configuration: 'configuration',
  AccessDenied: 'accessDenied',
  Verification: 'verification',
  OAuthSignin: 'oauthSignin',
  OAuthCallback: 'oauthCallback',
  OAuthCreateAccount: 'oauthCreateAccount',
  OAuthAccountNotLinked: 'oauthAccountNotLinked',
  Callback: 'callback',
  Default: 'default',
};

export default function LoginPage() {
  // useSearchParams() requires a <Suspense> boundary so Next.js can
  // statically prerender /[locale]/login. Without this wrapper the
  // build fails with: "useSearchParams() should be wrapped in a suspense
  // boundary at page '/[locale]/login'". LoginPageInner is the original
  // page body — split out so it can be deferred inside Suspense.
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const locale = useLocale();
  const t = useTranslations('auth');
  const tErrors = useTranslations('auth.errors');
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') ?? `/${locale}/dashboard`;

  useEffect(() => {
    if (!errorParam) {
      // No error → user landed here directly. Bounce them into the
      // Google OAuth roundtrip so behaviour matches the header button.
      void signIn('google', { callbackUrl, redirect: true });
    }
  }, [errorParam, callbackUrl]);

  const errorMessage = errorParam ? tErrors(ERROR_KEYS[errorParam] ?? ERROR_KEYS.Default) : null;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight">{t('loginTitle')}</h1>
      <p className="mt-3 text-muted-foreground">{t('loginSubtitle')}</p>

      {errorMessage ? (
        <div
          role="alert"
          className="mt-8 w-full rounded-md border border-destructive/50 bg-destructive/10 p-4 text-left text-sm text-destructive"
        >
          <p className="font-medium">{t('errorTitle')}</p>
          <p className="mt-1">{errorMessage}</p>
        </div>
      ) : null}

      <Button
        type="button"
        className="mt-8"
        onClick={() => void signIn('google', { callbackUrl, redirect: true })}
      >
        {t('loginWithGoogle')}
      </Button>

      <p className="mt-6 text-xs text-muted-foreground">{t('loginTerms')}</p>
    </div>
  );
}
