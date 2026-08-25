/**
 * Tests for the extracted NextAuth callbacks in src/lib/auth/next-auth.ts.
 *
 * These cover the security-critical paths added in this PR:
 *  - signIn callback: banned-user block (H1) + LOGIN_BLOCKED audit
 *  - jwt callback: tokenVersion bump invalidates (H2), deletedAt invalidates
 *  - session callback: missing token.id short-circuits
 *  - signIn event: fresh registration vs returning login distinction
 *
 * Prisma is mocked per-test so we never hit a real DB.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock state must be declared inside vi.hoisted so the vi.mock factories
// (which are hoisted to the top of the file) can reference it.
const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  logSecurityEvent: vi.fn().mockResolvedValue(undefined),
}));

// Mock next-auth BEFORE importing the module under test — the module
// calls NextAuth({...}) at import time, and the real import pulls in
// `next/server`, which doesn't resolve cleanly in the jsdom test env.
vi.mock('next-auth', () => ({
  default: () => ({
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
    auth: vi.fn(),
  }),
}));
vi.mock('next-auth/providers/google', () => ({
  default: () => ({}),
}));
vi.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: () => ({}),
}));
vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/lib/audit', () => ({ logSecurityEvent: mocks.logSecurityEvent }));

import {
  signInCallback,
  jwtCallback,
  sessionCallback,
  signInEvent,
  signOutEvent,
} from '@/lib/auth/next-auth';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('signInCallback', () => {
  const googleUser = { email: 'user@example.com', name: 'User', image: null };
  const googleAccount = { provider: 'google', providerAccountId: 'gid-1' };

  it('returns false for non-Google providers', async () => {
    const ok = await signInCallback({
      user: googleUser,
      account: { provider: 'github' },
    });
    expect(ok).toBe(false);
    expect(mocks.prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('creates the user when not found, then re-checks ban', async () => {
    mocks.prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'u1', isBanned: false, bannedReason: null });
    mocks.prisma.user.create.mockResolvedValue({ id: 'u1' });

    const ok = await signInCallback({ user: googleUser, account: googleAccount });

    expect(ok).toBe(true);
    expect(mocks.prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'user@example.com' }),
      })
    );
    expect(mocks.logSecurityEvent).not.toHaveBeenCalled();
  });

  it('blocks banned users on re-query and logs LOGIN_BLOCKED', async () => {
    mocks.prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'u1', isBanned: true, bannedReason: 'spam' })
      .mockResolvedValueOnce({ id: 'u1', isBanned: true, bannedReason: 'spam' });

    const ok = await signInCallback({ user: googleUser, account: googleAccount });

    expect(ok).toBe(false);
    expect(mocks.logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'LOGIN_BLOCKED',
        userId: 'u1',
        details: { reason: 'spam' },
      })
    );
  });

  it('treats null bannedReason as "unknown" in audit details', async () => {
    mocks.prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'u2', isBanned: false, bannedReason: null })
      .mockResolvedValueOnce({ id: 'u2', isBanned: true, bannedReason: null });

    const ok = await signInCallback({ user: googleUser, account: googleAccount });

    expect(ok).toBe(false);
    expect(mocks.logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ details: { reason: 'unknown' } })
    );
  });
});

describe('jwtCallback', () => {
  it('returns token unchanged on early invoke (no id, no user.email)', async () => {
    const token = {};
    const out = await jwtCallback({ token });
    expect(out).toBe(token);
    expect(mocks.prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('on first sign-in populates token from DB', async () => {
    mocks.prisma.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      role: 'USER',
      profileCompleted: true,
      languagePref: 'BN',
      isBanned: false,
      tokenVersion: 0,
    });
    const out = await jwtCallback({
      token: {},
      user: { email: 'u@x.com' },
    });
    expect(out).toMatchObject({
      id: 'u1',
      role: 'USER',
      profileCompleted: true,
      languagePref: 'BN',
      tokenVersion: 0,
    });
  });

  it('on refresh returns {} when user is soft-deleted (deletedAt set)', async () => {
    mocks.prisma.user.findUnique.mockResolvedValueOnce({
      isBanned: false,
      role: 'USER',
      profileCompleted: true,
      languagePref: 'BN',
      tokenVersion: 0,
      deletedAt: new Date(),
    });
    const out = await jwtCallback({
      token: { id: 'u1', lastBanCheck: 0 },
    });
    expect(out).toEqual({});
  });

  it('on refresh returns {} when DB tokenVersion is higher than stored', async () => {
    mocks.prisma.user.findUnique.mockResolvedValueOnce({
      isBanned: false,
      role: 'USER',
      profileCompleted: true,
      languagePref: 'BN',
      tokenVersion: 5,
      deletedAt: null,
    });
    const out = await jwtCallback({
      token: { id: 'u1', lastBanCheck: 0, tokenVersion: 3 },
    });
    expect(out).toEqual({});
  });

  it('on refresh throttles to once per 60s (no DB call when lastBanCheck is recent)', async () => {
    const out = await jwtCallback({
      token: { id: 'u1', lastBanCheck: Date.now() - 5_000, tokenVersion: 0 },
    });
    expect(out).toMatchObject({ id: 'u1' });
    expect(mocks.prisma.user.findUnique).not.toHaveBeenCalled();
  });
});

describe('sessionCallback', () => {
  it('returns session unchanged when token.id is missing', () => {
    const session = { user: { name: 'x' } };
    const out = sessionCallback({ session, token: {} });
    expect(out).toBe(session);
  });

  it('copies token fields into session.user', () => {
    const session: { user?: Record<string, unknown> } = { user: {} };
    const out = sessionCallback({
      session,
      token: {
        id: 'u1',
        role: 'ADMIN',
        profileCompleted: true,
        languagePref: 'EN',
        isBanned: false,
      },
    });
    expect(out.user).toMatchObject({
      id: 'u1',
      role: 'ADMIN',
      profileCompleted: true,
      languagePref: 'EN',
      isBanned: false,
    });
  });
});

describe('signInEvent', () => {
  it('logs USER_REGISTERED on fresh sign-in (lastLoginAt null + createdAt recent)', async () => {
    mocks.prisma.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      lastLoginAt: null,
      createdAt: new Date(Date.now() - 5_000),
    });
    mocks.prisma.user.update.mockResolvedValue({});

    await signInEvent({
      user: { email: 'u@x.com' },
      account: { provider: 'google', providerAccountId: 'gid-1' },
    });

    expect(mocks.logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER_LOGIN', userId: 'u1' })
    );
    expect(mocks.logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'USER_REGISTERED',
        userId: 'u1',
        details: expect.objectContaining({ provider: 'google', providerAccountId: 'gid-1' }),
      })
    );
  });

  it('does NOT log USER_REGISTERED for a returning login', async () => {
    mocks.prisma.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      lastLoginAt: new Date(Date.now() - 86_400_000),
      createdAt: new Date(Date.now() - 86_400_000),
    });
    mocks.prisma.user.update.mockResolvedValue({});

    await signInEvent({
      user: { email: 'u@x.com' },
      account: { provider: 'google', providerAccountId: 'gid-1' },
    });

    const calls = (mocks.logSecurityEvent as unknown as { mock: { calls: unknown[][] } }).mock
      .calls;
    const actions = calls.map((c) => (c[0] as { action: string }).action);
    expect(actions).toContain('USER_LOGIN');
    expect(actions).not.toContain('USER_REGISTERED');
  });

  it('ignores non-Google providers', async () => {
    await signInEvent({ user: { email: 'u@x.com' }, account: { provider: 'github' } });
    expect(mocks.prisma.user.findUnique).not.toHaveBeenCalled();
  });
});

describe('signOutEvent', () => {
  it('logs USER_LOGOUT when token has id', async () => {
    await signOutEvent({ token: { id: 'u1' } });
    expect(mocks.logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER_LOGOUT', userId: 'u1' })
    );
  });

  it('is a no-op when token has no id', async () => {
    await signOutEvent({ token: {} });
    expect(mocks.logSecurityEvent).not.toHaveBeenCalled();
  });
});
