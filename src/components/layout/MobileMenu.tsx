'use client';

/**
 * Mobile menu drawer. Shown only below the `md` breakpoint.
 *
 * Trigger: three-dot icon button on the right of the navbar. Clicking
 * it opens a right-side drawer that contains the same nav, auth, and
 * language controls that the desktop layout shows in a single row.
 *
 * Drawer contents (top to bottom):
 *   1. Header bar (title + close button).
 *   2. Auth block — avatar/name/email for signed-in users, or a
 *      full-width "Sign in" pill for guests.
 *   3. Main section — Home / About / Blog / Alumni.
 *   4. Account section — Dashboard / Settings / History (users).
 *   5. Admin section — Dashboard / Users / Reports / Donations (admins).
 *   6. Language section — বাংলা / English pill toggle.
 *   7. Footer — Sign out for signed-in users.
 *
 * Implementation notes:
 *   - The drawer is **portaled to document.body** so it escapes any
 *     positioning context from the navbar (the navbar is `sticky`
 *     with `backdrop-blur`, which can sometimes interfere with
 *     absolutely-positioned descendants in subtle ways). Rendering
 *     at the body root guarantees a known ancestor.
 *   - Always mounted; visibility/opacity is the only state. Uses
 *     `translate-x-full` ↔ `translate-x-0` + `transition-transform`
 *     for the slide animation — no keyframe plugin dependency.
 *   - Body scroll lock + Escape key handling while open.
 *   - SSR-safe: the portal target (`document.body`) is only accessed
 *     inside `useEffect`, so the first render outputs nothing.
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { MoreVertical, X, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
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
  /*
    `mounted` flips to true on the first client effect. Without this
    gate `createPortal(..., document.body)` would crash during SSR
    because `document` is undefined. The trigger button still renders
    during SSR; only the drawer body is gated.
  */
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
    Drawer body. Portaled to <body> to escape the navbar's positioning
    context. `fixed inset-0` covers the full viewport; the panel uses
    `inset-y-0 right-0` + `h-screen` so its height is always the
    viewport height regardless of how nested `h-full` resolves.
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
          className="absolute inset-0 bg-black/50"
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
          className={cn(
            'absolute inset-y-0 right-0 flex h-screen w-[85%] max-w-xs flex-col bg-background shadow-2xl transition-transform duration-200 ease-out',
            open ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          {/* Header bar */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
            <h2 className="text-base font-semibold">Menu</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {/* Auth block */}
            <div className="border-b px-4 py-4">
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  {session?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.image}
                      alt={session.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                    >
                      {initials}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {session?.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{session?.email}</p>
                  </div>
                </div>
              ) : (
                <Button asChild className="w-full rounded-full" size="lg">
                  <Link href={`/${locale}/login`} onClick={() => setOpen(false)}>
                    {labels.login}
                  </Link>
                </Button>
              )}
            </div>

            {/* Main section */}
            <Section title={labels.sectionsMain}>
              <DrawerLink href={`/${locale}`} active={isActive(`/${locale}`)}>
                {labels.home}
              </DrawerLink>
              <DrawerLink href={`/${locale}/about`} active={isActive(`/${locale}/about`)}>
                {labels.about}
              </DrawerLink>
              <DrawerLink href={`/${locale}/blog`} active={isActive(`/${locale}/blog`)}>
                {labels.blog}
              </DrawerLink>
              <DrawerLink href={`/${locale}/alumni`} active={isActive(`/${locale}/alumni`)}>
                {labels.alumni}
              </DrawerLink>
            </Section>

            {/* Account section */}
            {isLoggedIn && (
              <Section title={labels.sectionsAccount}>
                <DrawerLink href={`/${locale}/dashboard`} active={isActive(`/${locale}/dashboard`)}>
                  {labels.dashboard}
                </DrawerLink>
                {!isAdmin && (
                  <DrawerLink href={`/${locale}/settings`} active={isActive(`/${locale}/settings`)}>
                    {labels.settings}
                  </DrawerLink>
                )}
                {!isAdmin && (
                  <DrawerLink href={`/${locale}/history`} active={isActive(`/${locale}/history`)}>
                    {labels.history}
                  </DrawerLink>
                )}
              </Section>
            )}

            {/* Admin section */}
            {isAdmin && (
              <Section title={labels.sectionsAdmin}>
                <DrawerLink
                  href={`/${locale}/admin/dashboard`}
                  active={isActive(`/${locale}/admin/dashboard`)}
                >
                  {labels.dashboard}
                </DrawerLink>
                <DrawerLink
                  href={`/${locale}/admin/users`}
                  active={isActive(`/${locale}/admin/users`)}
                >
                  {labels.users}
                </DrawerLink>
                <DrawerLink
                  href={`/${locale}/admin/reports`}
                  active={isActive(`/${locale}/admin/reports`)}
                >
                  {labels.reports}
                </DrawerLink>
                <DrawerLink
                  href={`/${locale}/admin/donations`}
                  active={isActive(`/${locale}/admin/donations`)}
                >
                  {labels.donations}
                </DrawerLink>
              </Section>
            )}

            {/* Language section */}
            <Section title="Language">
              <div className="flex gap-2 px-4 pb-2">
                {locales.map((l) => {
                  const active = l === currentLocale;
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => handleLocaleChange(l)}
                      aria-pressed={active}
                      className={cn(
                        'h-9 flex-1 rounded-full text-sm font-semibold transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                      )}
                    >
                      {l === 'bn' ? 'বাংলা' : 'English'}
                    </button>
                  );
                })}
              </div>
            </Section>
          </div>

          {/* Footer — sign out for logged-in users */}
          {isLoggedIn && (
            <div className="shrink-0 border-t p-3">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start gap-2 rounded-full"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {labels.logout}
              </Button>
            </div>
          )}
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
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background text-foreground transition-colors hover:bg-accent active:bg-accent/80 md:hidden"
      >
        <MoreVertical className="h-5 w-5" aria-hidden="true" />
      </button>

      {/*
        Portal the drawer to document.body so it isn't constrained by
        the navbar's `sticky` + `backdrop-blur` ancestor (which can
        subtly affect absolutely-positioned descendants' height
        calculations in some browsers).
      */}
      {mounted && drawer ? createPortal(drawer, document.body) : null}
    </>
  );
}

/** Section heading inside the drawer. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b py-3">
      <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

/** Single nav link inside the drawer. Larger tap target for thumbs. */
function DrawerLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex h-11 items-center px-4 text-sm font-medium transition-colors',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      {children}
    </Link>
  );
}
