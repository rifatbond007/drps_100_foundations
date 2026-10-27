import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ShieldCheck } from 'lucide-react';
import { MARKETING_NAV } from '@/lib/config/site';
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
    <footer className="mt-16 border-t bg-muted/40">
      <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo href={`/${locale}`} name={appName} />
          <p className="mt-4 text-sm text-muted-foreground">{t('tagline')}</p>
          <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            {t('paymentNote')}
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
      <div className="border-t">
        <p className="container py-5 text-xs text-muted-foreground">
          {t('copyright', { year: new Date().getFullYear(), appName })}
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-3 flex flex-col gap-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {children}
      </Link>
    </li>
  );
}
