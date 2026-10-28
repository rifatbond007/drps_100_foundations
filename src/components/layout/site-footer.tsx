import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ShieldCheck } from 'lucide-react';
import { MARKETING_NAV } from '@/lib/config/site';
import { WORDMARK } from '@/features/landing/wordmark-path';
import { Logo } from './logo';

export async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const appName = tCommon('appName');

  const accountLinks = [
    { key: 'donate', href: `/${locale}/donate` },
    { key: 'dashboard', href: `/${locale}/dashboard` },
    { key: 'history', href: `/${locale}/history` },
  ] as const;

  return (
    // Deep-green band, matching the landing page's dark sections.
    <footer className="relative mt-16 overflow-hidden bg-[hsl(162_45%_9%)] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 size-[30rem] rounded-full bg-emerald-500/15 blur-3xl"
      />
      <div className="container relative grid grid-cols-2 gap-x-8 gap-y-12 pb-12 pt-16 sm:pt-20 lg:grid-cols-[3fr_1fr_1fr]">
        <div className="col-span-2 max-w-md lg:col-span-1">
          <Logo href={`/${locale}`} name={appName} />
          <p className="mt-5 text-balance text-xl font-semibold leading-snug sm:text-2xl">
            {t('tagline')}
          </p>
        </div>
        <FooterColumn title={t('explore')}>
          {MARKETING_NAV.map(({ key, path }) => (
            <FooterLink key={key} href={`/${locale}${path}`}>
              {tNav(key)}
            </FooterLink>
          ))}
        </FooterColumn>
        <FooterColumn title={t('account')}>
          {accountLinks.map(({ key, href }) => (
            <FooterLink key={key} href={href}>
              {tNav(key)}
            </FooterLink>
          ))}
        </FooterColumn>
      </div>
      {/* Brand watermark: oversized, faint, fading toward the bottom bar, with a
          band of light sweeping left to right and back. */}
      <div aria-hidden className="container pointer-events-none relative select-none">
        <svg
          viewBox={`0 0 ${WORDMARK.width} ${WORDMARK.height}`}
          className="-mb-[6%] block h-auto w-full"
        >
          <defs>
            <linearGradient id="footer-watermark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.09" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            {/* Sweep: a bright band in user space, slid across the word and back. */}
            <linearGradient
              id="footer-watermark-sweep"
              gradientUnits="userSpaceOnUse"
              x1="-240"
              y1="0"
              x2="0"
              y2="0"
            >
              <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0" />
              <stop offset="50%" stopColor="#6ee7b7" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0" />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                values={`0 0; ${WORDMARK.width + 240} 0; 0 0`}
                keyTimes="0; 0.5; 1"
                calcMode="spline"
                keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
                dur="9s"
                repeatCount="indefinite"
              />
            </linearGradient>
            {/* Fades the sweep toward the bottom, like the watermark itself. */}
            <linearGradient id="footer-watermark-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="100%" stopColor="#000" />
            </linearGradient>
            <mask id="footer-watermark-mask">
              <rect
                width={WORDMARK.width}
                height={WORDMARK.height}
                fill="url(#footer-watermark-fade)"
              />
            </mask>
          </defs>
          <path d={WORDMARK.d} fill="url(#footer-watermark)" />
          <path
            d={WORDMARK.d}
            fill="url(#footer-watermark-sweep)"
            mask="url(#footer-watermark-mask)"
            className="motion-reduce:hidden"
          />
        </svg>
      </div>
      <div className="relative border-t border-white/10">
        <div className="container flex flex-col gap-3 py-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>{t('copyright', { year: new Date().getFullYear(), appName })}</p>
          <p className="flex items-start gap-2 sm:items-center">
            <ShieldCheck className="size-4 shrink-0 text-emerald-300" aria-hidden />
            {t('paymentNote')}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">{title}</p>
      <ul className="mt-5 flex flex-col gap-3">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-base text-white/70 transition-colors hover:text-white">
        {children}
      </Link>
    </li>
  );
}
