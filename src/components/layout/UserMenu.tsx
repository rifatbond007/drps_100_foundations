'use client';

/**
 * Authenticated user menu for the navbar.
 *
 * Shows the Google avatar (or a fallback initial) + display name with a
 * dropdown containing Dashboard / Settings / Sign out. Clicking the avatar
 * or name toggles the menu; clicking outside or pressing Escape closes it.
 *
 * Reuses:
 *   - `signOut` from next-auth/react (same pattern as SignOutButton)
 *   - `Button` from @/components/ui/button
 *   - `Image` from next/image for the avatar (allowed domains configured in
 *     next.config.js — googleusercontent.com + r2.cloudflarestorage.com)
 *
 * No external dropdown dependency — implemented as a small popover with
 * `useState` + click-outside + Escape. If the project later adds
 * @radix-ui/react-dropdown-menu, swap the popover body in place.
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface Props {
  locale: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  /**
   * When true, the menu shows admin shortcuts (Dashboard / Users / Reports)
   * and hides the personal Settings link, since admins don't manage their
   * own profile from this menu. Defaults to false.
   */
  isAdmin?: boolean;
}

export function UserMenu({ locale, name, email, avatarUrl, isAdmin = false }: Props) {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const initials = (name || email).trim().slice(0, 1).toUpperCase();

  const handleSignOut = () => {
    setOpen(false);
    void signOut({ callbackUrl: `/${locale}` });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${name} menu`}
        className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {avatarUrl ? (
          // Plain <img> avoids next/image optimizer issues with Google's
          // CDN URLs (redirects, size params, dynamic cache keys). The
          // allowed-domains list in next.config.js is for next/image; raw
          // <img> works for any HTTPS image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
          >
            {initials}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="User menu"
          className="bg-popover text-popover-foreground absolute right-0 mt-2 w-56 rounded-md border p-1 shadow-md"
        >
          <div className="border-b px-3 py-2 text-sm">
            <p className="font-medium leading-tight">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>

          {isAdmin ? (
            <>
              <Link
                href={`/${locale}/admin/users`}
                role="menuitem"
                className="block rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => setOpen(false)}
              >
                {t('dashboard')}
              </Link>
              <Link
                href={`/${locale}/admin/users`}
                role="menuitem"
                className="block rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => setOpen(false)}
              >
                {t('users')}
              </Link>
              <Link
                href={`/${locale}/admin/reports`}
                role="menuitem"
                className="block rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => setOpen(false)}
              >
                {t('reports')}
              </Link>
            </>
          ) : (
            <>
              <Link
                href={`/${locale}/dashboard`}
                role="menuitem"
                className="block rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => setOpen(false)}
              >
                {t('dashboard')}
              </Link>
              <Link
                href={`/${locale}/settings`}
                role="menuitem"
                className="block rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => setOpen(false)}
              >
                {t('settings')}
              </Link>
            </>
          )}

          <div className="my-1 border-t" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            role="menuitem"
            onClick={handleSignOut}
            className="w-full justify-start"
          >
            {t('logout')}
          </Button>
        </div>
      )}
    </div>
  );
}
