'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { Globe, LogOut, Settings } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ShellUser } from './app-shell';

export function UserMenu({ user }: { user: ShellUser }) {
  const locale = useLocale();
  const t = useTranslations('nav');
  const tA11y = useTranslations('a11y');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={tA11y('userMenu')}
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Avatar name={user.name} src={user.image} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel>
          <p className="truncate font-semibold">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/settings`}>
            <Settings aria-hidden />
            {t('settings')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${locale}`}>
            <Globe aria-hidden />
            {t('backToSite')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => void signOut({ callbackUrl: `/${locale}` })}
        >
          <LogOut aria-hidden />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
