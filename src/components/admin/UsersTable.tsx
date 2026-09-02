/**
 * Admin users management table.
 *
 * Layout: a filter row (search + role + banned selects) at the top,
 * then a register list of users. Each user row shows avatar + name +
 * email + role label + status label + joined date + total donated.
 * Action button is "Ban" or "Unban" — right-aligned.
 *
 * Status is rendered as a small uppercase eyebrow (BANNED / ACTIVE),
 * not as a green/red dot chip. Same colour key as the rest of the app
 * (admin = muted/foreground, destructive = red).
 *
 * Ban uses an inline reason editor: a row expands to show a textarea
 * + confirm/cancel buttons. No modal.
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api/client';
import { ApiClientError } from '@/lib/api/errors';
import { cn, formatBDT } from '@/lib/utils';

type Role = 'USER' | 'ADMIN';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: Role;
  isBanned: boolean;
  bannedAt: string | null;
  bannedReason: string | null;
  languagePref: 'BN' | 'EN';
  profileCompleted: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  donationCount: number;
  totalDonated: string;
}

interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ListResponse {
  users: AdminUser[];
  pagination: PageMeta;
}

const ALL = '__all__';

function useDebounce<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export function UsersTable() {
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('admin.users.toasts');

  const [q, setQ] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [banned, setBanned] = useState<'' | 'true' | 'false'>('');
  const [page, setPage] = useState(1);

  const debouncedQ = useDebounce(q, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, role, banned]);

  const params = useMemo(
    () => ({
      ...(debouncedQ ? { q: debouncedQ } : {}),
      ...(role ? { role } : {}),
      ...(banned ? { banned } : {}),
      page,
      limit: 20,
    }),
    [debouncedQ, role, banned, page]
  );

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<ListResponse>('/api/admin/users', { params });
      setData(result);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserLocally = (id: string, patch: Partial<AdminUser>) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            users: prev.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
          }
        : prev
    );
  };

  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  const withOptimistic = useCallback(
    async (
      id: string,
      patch: Partial<AdminUser>,
      request: () => Promise<unknown>,
      successMsg: string,
      errorMsg: string
    ) => {
      setBannerError(null);
      setBannerSuccess(null);
      const prev = data?.users.find((u) => u.id === id);
      updateUserLocally(id, patch);
      try {
        await request();
        setBannerSuccess(successMsg);
        setTimeout(() => setBannerSuccess(null), 3000);
      } catch (e) {
        if (prev) updateUserLocally(id, prev);
        const msg = e instanceof ApiClientError ? e.message : 'Unknown error';
        setBannerError(errorMsg + msg);
        setTimeout(() => setBannerError(null), 5000);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  );

  const onUnban = async (user: AdminUser) => {
    await withOptimistic(
      user.id,
      { isBanned: false, bannedAt: null, bannedReason: null },
      () => apiClient.delete(`/api/admin/users/${user.id}/unban`),
      tCommon('unbanned'),
      tCommon('error', { message: '' }).replace(': ', '')
    );
  };

  const onBanConfirm = async (user: AdminUser, reason: string) => {
    await withOptimistic(
      user.id,
      { isBanned: true, bannedAt: new Date().toISOString(), bannedReason: reason },
      () => apiClient.post(`/api/admin/users/${user.id}/ban`, { reason }),
      tCommon('banned'),
      tCommon('error', { message: '' }).replace(': ', '')
    );
    setBanFor(null);
    setBanReason('');
  };

  const [banFor, setBanFor] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState('');

  return (
    <div className="space-y-4">
      {/* Filter row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="pl-9"
            aria-label={t('search')}
          />
        </div>
        <Select value={role || ALL} onValueChange={(v) => setRole(v === ALL ? '' : (v as Role))}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder={t('role')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('role') + ': —'}</SelectItem>
            <SelectItem value="USER">{t('roles.USER')}</SelectItem>
            <SelectItem value="ADMIN">{t('roles.ADMIN')}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={banned || ALL}
          onValueChange={(v) => setBanned(v === ALL ? '' : (v as 'true' | 'false'))}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder={t('status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('status') + ': —'}</SelectItem>
            <SelectItem value="false">{t('statuses.active')}</SelectItem>
            <SelectItem value="true">{t('statuses.banned')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {bannerSuccess && (
        <p className="border-l-2 border-primary bg-primary/5 px-3 py-2 text-sm text-primary">
          {bannerSuccess}
        </p>
      )}
      {bannerError && (
        <p className="border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {bannerError}
        </p>
      )}
      {error && (
        <p className="border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* User register */}
      {loading && !data && <p className="py-8 text-center text-sm text-muted-foreground">…</p>}

      {data?.users.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
      )}

      {data && data.users.length > 0 && (
        <ol className="border-t border-border">
          {data.users.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              roleLabel={t(`roles.${u.role}`)}
              statusLabel={u.isBanned ? t('statuses.banned') : t('statuses.active')}
              banLabel={t('ban')}
              unbanLabel={t('unban')}
              onStartBan={() => {
                setBanFor(u);
                setBanReason('');
              }}
              onUnban={() => void onUnban(u)}
            />
          ))}
        </ol>
      )}

      {banFor && (
        <BanForm
          user={banFor}
          reason={banReason}
          onReasonChange={setBanReason}
          onCancel={() => {
            setBanFor(null);
            setBanReason('');
          }}
          onConfirm={() => void onBanConfirm(banFor, banReason.trim())}
          labels={{
            title: t('banDialog.title'),
            reasonLabel: t('banDialog.reasonLabel'),
            reasonPlaceholder: t('banDialog.reasonPlaceholder'),
            cancel: t('banDialog.cancel'),
            confirm: t('banDialog.confirm'),
          }}
        />
      )}

      {data && data.pagination.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            {t('pagination.page', {
              page: data.pagination.page,
              total: data.pagination.totalPages,
            })}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex h-9 items-center border border-input bg-background px-3 text-sm font-medium hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
            >
              {t('pagination.prev')}
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page >= data.pagination.totalPages || loading}
              className="inline-flex h-9 items-center border border-input bg-background px-3 text-sm font-medium hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
            >
              {t('pagination.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  roleLabel,
  statusLabel,
  banLabel,
  unbanLabel,
  onStartBan,
  onUnban,
}: {
  user: AdminUser;
  roleLabel: string;
  statusLabel: string;
  banLabel: string;
  unbanLabel: string;
  onStartBan: () => void;
  onUnban: () => void;
}) {
  return (
    <li className="border-b border-border py-3">
      <div className="grid items-center gap-2 sm:grid-cols-[1fr_auto]">
        <div className="flex items-center gap-3">
          <Avatar url={user.avatarUrl} name={user.name} />
          <div className="min-w-0">
            <div className="truncate font-medium">{user.name || '—'}</div>
            <div className="truncate text-xs text-muted-foreground">{user.email}</div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>
                <span className="uppercase tracking-wide">{roleLabel}</span>
              </span>
              <span
                className={cn(
                  'uppercase tracking-wide',
                  user.isBanned ? 'text-destructive' : 'text-primary'
                )}
              >
                {statusLabel}
              </span>
              <span className="tabular-nums">{new Date(user.createdAt).toLocaleDateString()}</span>
              <span className="tabular-nums">{formatBDT(user.totalDonated)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end">
          {user.isBanned ? (
            <button
              type="button"
              onClick={onUnban}
              className="inline-flex h-9 items-center border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
            >
              {unbanLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartBan}
              className="inline-flex h-9 items-center border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
            >
              {banLabel}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        referrerPolicy="no-referrer"
        className="h-9 w-9 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold">
      {initial}
    </div>
  );
}

function BanForm({
  user,
  reason,
  onReasonChange,
  onCancel,
  onConfirm,
  labels,
}: {
  user: AdminUser;
  reason: string;
  onReasonChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  labels: {
    title: string;
    reasonLabel: string;
    reasonPlaceholder: string;
    cancel: string;
    confirm: string;
  };
}) {
  const reasonError = reason.trim().length > 0 && reason.trim().length < 10;
  const canSubmit = reason.trim().length >= 10;

  return (
    <div className="border-l-2 border-destructive bg-destructive/5 px-4 py-3">
      <p className="text-sm font-semibold">
        {labels.title} — <span className="font-normal">{user.name || user.email}</span>
      </p>
      <label className="mt-2 block text-xs font-medium text-muted-foreground">
        {labels.reasonLabel}
      </label>
      <textarea
        value={reason}
        onChange={(e) => onReasonChange(e.target.value)}
        placeholder={labels.reasonPlaceholder}
        rows={2}
        className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {reasonError && <p className="mt-1 text-xs text-destructive">10+ chars</p>}
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-9 items-center border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
        >
          {labels.cancel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!canSubmit}
          className="inline-flex h-9 items-center bg-destructive px-3 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {labels.confirm}
        </button>
      </div>
    </div>
  );
}
