'use client';

/**
 * Mobile menu drawer. Shown only below the `md` breakpoint.
 *
 * Editorial register layout:
 *   - Auth block pinned at the top (identity strip, not a card).
 *   - Sections in the middle as labelled registers: a section header
 *     (small uppercase eyebrow) followed by an unbroken list of items
 *     separated by hairline rules. The active item is marked by an
 *     inset emerald left bar (border-l-2), not by a chip background.
 *     Tap targets are tall (h-12) for thumbs.
 *   - Language toggle + sign-out pinned at the bottom as a sticky footer
 *     so the user never has to scroll past a long nav list to find them.
 *
 * Implementation notes:
 *   - The drawer is portaled to document.body so it escapes the navbar's
 *     `sticky` + `backdrop-blur` ancestor.
 *   - Always mounted; visibility/opacity is the only state. Uses
 *     `translate-x-full` ↔ `translate-x-0` + `transition-transform` for
 *     the slide animation.
 *   - Body scroll lock + Escape key handling while open.
 *   - SSR-safe: the portal target (document.body) is only accessed
 *     inside useEffect, so the first render outputs nothing.
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { X, LogOut, Globe } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { locales, type Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

interface Props {
  locale: string;
  labels: {
    home: string;
    about: string;
    blog: string;
    alumni: string;
    dashboard: string;
    donate: string;
    settings: string;
    history: string;
    users: string;
    reports: string;
    donations: string;
    sectionsMain: string;
    sectionsAccount: string;
    sectionsAdmin: string;
    login: string;
    logout: string;
    language: string;
  };
  session: {
    name: string;
    email: string;
    image: string | null;
    role: 'ADMIN' | 'USER';
  } | null;
}

export function MobileMenu({ locale, labels, session }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  // mounted flips to true on the first client effect. Without this gate,
  // createPortal(..., document.body) crashes during SSR because document
  // is undefined. The trigger button still renders during SSR; only the
  // drawer body is gated.
  const [mounted, setMounted] = useState(false);

  const isLoggedIn = !!session;
  const isAdmin = session?.role === 'ADMIN';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Body scroll lock + Escape handler.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      html.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) {
      setOpen(false);
      return;
    }
    const newPath = pathname.replace(/^\/(bn|en)/, `/${newLocale}`);
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    setOpen(false);
    router.push(newPath);
  };

  const handleLogout = () => {
    setOpen(false);
    void signOut({ callbackUrl: `/${locale}` });
  };

  const initials = (session?.name || session?.email || '').trim().slice(0, 1).toUpperCase();

  // Pre-compute active states against the locale-stripped path.
  const stripped = pathname.replace(/^\/(bn|en)/, '');
  const isActive = (href: string) => {
    const target = href.replace(/^\/(bn|en)/, '');
    return stripped === target || stripped.startsWith(target + '/');
  };

  /*
   * Drawer body. Portaled to <body> to escape the navbar's positioning
   * context. The panel uses `inset-y-0 right-0` + `h-screen` so its
   * height is the viewport height regardless of how nested `h-full`
   * resolves.
   *
   * Internal layout is three rows: sticky auth header, scrollable nav
   * middle, sticky footer for language + sign-out.
   */
  const drawer =
    mounted &&
    ((
      <div
        aria-hidden={!open}
        className={cn(
          'fixed inset-0 z-[200] md:hidden',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="absolute inset-0 bg-black/60"
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
          className={cn(
            'absolute inset-y-0 right-0 flex h-screen w-full max-w-sm flex-col bg-background shadow-2xl transition-transform duration-200 ease-out',
            open ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          {/* ─── Sticky auth header ────────────────────────────── */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
            {isLoggedIn ? (
              <div className="flex min-w-0 items-center gap-3">
                {session?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.image}
                    alt={session.name}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                  >
                    {initials}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{session?.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{session?.email}</p>
                </div>
              </div>
            ) : (
              <Link
                href={`/${locale}/login`}
                onClick={() => setOpen(false)}
                className="inline-flex h-10 items-center bg-primary px-5 text-sm font-semibold text-primary-foreground"
              >
                {labels.login}
              </Link>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="-mr-2 flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* ─── Nav register ──────────────────────────────────── */}
          <nav className="flex-1 overflow-y-auto">
            {/* Main public section */}
            <Section title={labels.sectionsMain}>
              <DrawerItem href={`/${locale}`} active={isActive(`/${locale}`)}>
                {labels.home}
              </DrawerItem>
              <DrawerItem href={`/${locale}/about`} active={isActive(`/${locale}/about`)}>
                {labels.about}
              </DrawerItem>
              <DrawerItem href={`/${locale}/blog`} active={isActive(`/${locale}/blog`)}>
                {labels.blog}
              </DrawerItem>
              <DrawerItem href={`/${locale}/alumni`} active={isActive(`/${locale}/alumni`)}>
                {labels.alumni}
              </DrawerItem>
            </Section>

            {/* Account (signed-in users only) */}
            {isLoggedIn && !isAdmin && (
              <Section title={labels.sectionsAccount}>
                <DrawerItem href={`/${locale}/dashboard`} active={isActive(`/${locale}/dashboard`)}>
                  {labels.dashboard}
                </DrawerItem>
                <DrawerItem href={`/${locale}/donate`} active={isActive(`/${locale}/donate`)}>
                  {labels.donate}
                </DrawerItem>
                <DrawerItem href={`/${locale}/history`} active={isActive(`/${locale}/history`)}>
                  {labels.history}
                </DrawerItem>
                <DrawerItem href={`/${locale}/settings`} active={isActive(`/${locale}/settings`)}>
                  {labels.settings}
                </DrawerItem>
              </Section>
            )}

            {/* Admin (admins only) */}
            {isAdmin && (
              <Section title={labels.sectionsAdmin}>
                <DrawerItem
                  href={`/${locale}/admin/dashboard`}
                  active={isActive(`/${locale}/admin/dashboard`)}
                >
                  {labels.dashboard}
                </DrawerItem>
                <DrawerItem
                  href={`/${locale}/admin/users`}
                  active={isActive(`/${locale}/admin/users`)}
                >
                  {labels.users}
                </DrawerItem>
                <DrawerItem
                  href={`/${locale}/admin/reports`}
                  active={isActive(`/${locale}/admin/reports`)}
                >
                  {labels.reports}
                </DrawerItem>
                <DrawerItem
                  href={`/${locale}/admin/donations`}
                  active={isActive(`/${locale}/admin/donations`)}
                >
                  {labels.donations}
                </DrawerItem>
              </Section>
            )}
          </nav>

          {/* ─── Sticky footer: language + sign-out ─────────────── */}
          <div className="shrink-0 border-t border-border bg-background">
            <div className="flex items-center gap-2 px-4 py-3">
              <Globe className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="flex flex-1 gap-2">
                {locales.map((l) => {
                  const active = l === currentLocale;
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => handleLocaleChange(l)}
                      aria-pressed={active}
                      className={cn(
                        'h-10 flex-1 border text-sm font-semibold transition-colors',
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:bg-accent'
                      )}
                    >
                      {l === 'bn' ? 'বাংলা' : 'English'}
                    </button>
                  );
                })}
              </div>
            </div>
            {isLoggedIn && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-12 w-full items-center gap-3 border-t border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <LogOut className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {labels.logout}
              </button>
            )}
          </div>
        </aside>
      </div>
    ) as React.ReactElement);

  return (
    <>
      {/* Hamburger trigger — only visible on mobile */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-10 w-10 shrink-0 items-center justify-center text-foreground transition-colors hover:bg-accent md:hidden"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          aria-hidden="true"
          className="stroke-current"
          fill="none"
          strokeWidth="1.75"
          strokeLinecap="round"
        >
          <path d="M3 6h16M3 11h16M3 16h16" />
        </svg>
      </button>

      {mounted && drawer ? createPortal(drawer, document.body) : null}
    </>
  );
}

/** Section heading inside the drawer. Tight spacing, full-width hairline
 *  rule below it so the register of items reads as its own column. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-4 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <ul className="border-y border-border">{children}</ul>
    </div>
  );
}

/** Single nav row. Hairline divider between siblings is provided by
 *  `border-b border-border last:border-b-0` so the register reads as
 *  one continuous column. */
function DrawerItem({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative flex h-12 items-center pl-4 pr-4 text-base font-medium transition-colors',
          'border-l-2',
          active
            ? 'border-l-primary bg-primary/5 text-foreground'
            : 'border-l-transparent text-foreground hover:bg-accent'
        )}
      >
        {children}
      </Link>
    </li>
  );
}
