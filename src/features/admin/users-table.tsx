'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Search, UserX, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { LoadError } from '@/components/ui/load-error';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminUsers, type AdminUser } from '@/hooks/use-admin';
import { formatBDT, formatDate, formatNumber, toAppLocale } from '@/lib/format';
import { BanDialog } from './ban-dialog';
import { Pager } from './pager';

const FILTERS = ['all', 'admins', 'banned'] as const;
type Filter = (typeof FILTERS)[number];

function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export function UsersTable() {
  const locale = toAppLocale(useLocale());
  const t = useTranslations('admin.users');
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<AdminUser | null>(null);
  const q = useDebounced(search.trim());

  useEffect(() => setPage(1), [q, filter]);

  const query = useAdminUsers({
    q: q || undefined,
    role: filter === 'admins' ? 'ADMIN' : undefined,
    banned: filter === 'banned' ? true : undefined,
    page,
  });
  const users = query.data?.users ?? [];

  const action = (u: AdminUser) =>
    u.role === 'ADMIN' || u.id === session?.user?.id ? null : (
      <Button
        size="sm"
        variant="outline"
        className={u.isBanned ? undefined : 'text-destructive hover:text-destructive'}
        onClick={() => setTarget(u)}
      >
        {t(u.isBanned ? 'unban' : 'ban')}
      </Button>
    );

  const status = (u: AdminUser) => (
    <Badge variant={u.isBanned ? 'danger' : 'success'}>
      {t(`statuses.${u.isBanned ? 'banned' : 'active'}`)}
    </Badge>
  );

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-sm sm:flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            className="pl-10"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            {FILTERS.map((f) => (
              <TabsTrigger key={f} value={f}>
                {t(`filters.${f}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {query.isLoading ? (
        <Skeleton className="h-80 w-full rounded-lg" />
      ) : query.isError ? (
        <LoadError message={t('loadFailed')} onRetry={() => void query.refetch()} />
      ) : users.length === 0 ? (
        <EmptyState icon={filter === 'banned' ? UserX : Users} title={t('empty')} />
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-lg border bg-card shadow-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('user')}</TableHead>
                  <TableHead>{t('role')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="text-right">{t('totalDonated')}</TableHead>
                  <TableHead>{t('joinedAt')}</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">{t('actions')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name ?? u.email} src={u.avatarUrl} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{u.name ?? '—'}</p>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'ADMIN' ? 'warning' : 'neutral'}>
                        {t(`roles.${u.role}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>{status(u)}</TableCell>
                    <TableCell className="tabular text-right">
                      <p className="font-semibold">{formatBDT(u.totalDonated, locale)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(u.donationCount, locale)} {t('donations')}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(u.createdAt, locale)}
                    </TableCell>
                    <TableCell className="text-right">{action(u)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: cards */}
          <ul className="flex flex-col gap-3 md:hidden">
            {users.map((u) => (
              <li key={u.id} className="rounded-lg border bg-card p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <Avatar name={u.name ?? u.email} src={u.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{u.name ?? '—'}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  {status(u)}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
                  <p className="tabular text-sm">
                    <span className="font-semibold">{formatBDT(u.totalDonated, locale)}</span>{' '}
                    <span className="text-muted-foreground">
                      · {formatNumber(u.donationCount, locale)} {t('donations')}
                    </span>
                  </p>
                  {action(u)}
                </div>
              </li>
            ))}
          </ul>
          <Pager page={page} totalPages={query.data?.pagination.totalPages ?? 1} onPage={setPage} />
        </>
      )}

      {target && (
        <BanDialog
          user={target}
          onClose={() => setTarget(null)}
          onDone={() => void query.refetch()}
        />
      )}
    </>
  );
}
