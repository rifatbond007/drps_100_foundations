/**
 * NextAuth v5 (Auth.js) configuration.
 * - Google OAuth only (no passwords)
 * - JWT sessions
 * - Adds custom fields to session via callbacks
 * - Creates User on first sign-in
 * - Logs audit events
 */
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { logSecurityEvent } from '@/lib/audit';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be set');
}
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set');
}

/**
 * signIn callback — extracted so it can be unit-tested in isolation.
 * Returns false to block sign-in (NextAuth surfaces the configured error page).
 */
export async function signInCallback({
  user,
  account,
}: {
  user: { email?: string | null; name?: string | null; image?: string | null };
  account?: { provider: string } | null;
}): Promise<boolean> {
  if (account?.provider !== 'google') return false;

  const existing = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email: user.email!,
        name: user.name || '',
        avatarUrl: user.image,
        emailVerified: new Date(),
        profileCompleted: false,
        settings: { create: {} },
      },
    });
  }

  // H1 audit fix: re-query after the conditional create so a banned
  // user whose row was deleted between OAuth roundtrip and callback
  // is still blocked on re-sign-in.
  const current = await prisma.user.findUnique({
    where: { email: user.email! },
    select: { id: true, isBanned: true, bannedReason: true },
  });

  if (current?.isBanned) {
    await logSecurityEvent({
      action: 'LOGIN_BLOCKED',
      userId: current.id,
      details: { reason: current.bannedReason ?? 'unknown' },
    });
    return false;
  }

  return true;
}

/**
 * jwt callback — extracted for unit testing.
 *
 * H3: if token has no id AND no user.email, return token unchanged
 *   (early-invoke case before sign-in completes).
 * H2: throttle the ban/tokenVersion recheck to once per 60 s per token.
 */
export async function jwtCallback(params: {
  token: Record<string, unknown>;
  user?: { email?: string | null; name?: string | null; image?: string | null } | null;
}): Promise<Record<string, unknown>> {
  const { token, user } = params;

  if (!token.id && !user?.email) return token;

  if (user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: {
        id: true,
        role: true,
        profileCompleted: true,
        languagePref: true,
        isBanned: true,
        tokenVersion: true,
        // Pull avatarUrl + name from DB so they're guaranteed to land on
        // the JWT even when the OAuth `user` object isn't forwarded here
        // (which can happen with adapter-based JWT sessions in next-auth v5).
        name: true,
        avatarUrl: true,
      },
    });
    if (dbUser) {
      token.id = dbUser.id;
      token.role = dbUser.role;
      token.profileCompleted = dbUser.profileCompleted;
      token.languagePref = dbUser.languagePref;
      token.isBanned = dbUser.isBanned;
      token.tokenVersion = dbUser.tokenVersion ?? 0;
      // Prefer OAuth provider values on first sign-in; fall back to DB.
      token.name = user.name ?? dbUser.name;
      token.image = user.image ?? dbUser.avatarUrl;
    }
    return token;
  }

  const lastChecked = (token.lastBanCheck as number | undefined) ?? 0;
  const now = Date.now();
  if (now - lastChecked < 60_000) return token;

  token.lastBanCheck = now;
  if (!token.id) return token;

  const dbUser = await prisma.user.findUnique({
    where: { id: token.id as string },
    select: {
      isBanned: true,
      role: true,
      profileCompleted: true,
      languagePref: true,
      tokenVersion: true,
      deletedAt: true,
      name: true,
      avatarUrl: true,
    },
  });

  if (!dbUser || dbUser.deletedAt) return {};
  if (dbUser.isBanned) return {};

  const storedVersion = (token.tokenVersion as number | undefined) ?? 0;
  if ((dbUser.tokenVersion ?? 0) > storedVersion) return {};

  token.isBanned = dbUser.isBanned;
  token.role = dbUser.role;
  token.profileCompleted = dbUser.profileCompleted;
  token.languagePref = dbUser.languagePref;
  // Refresh name/image on every ban-check DB roundtrip (every 60s) so
  // profile updates via /api/users/profile show up in the navbar without
  // a forced sign-out. Only overwrite when DB has a value — never blank
  // out a populated token field with null.
  if (dbUser.name) token.name = dbUser.name;
  if (dbUser.avatarUrl) token.image = dbUser.avatarUrl;

  return token;
}

/**
 * session callback — extracted for unit testing.
 * Maps JWT token fields to the session.user shape.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sessionCallback(params: any): any {
  const { session, token } = params as {
    session: { user?: Record<string, unknown> };
    token: Record<string, unknown>;
  };
  if (!token.id) return session;
  if (session.user) {
    session.user.id = token.id;
    session.user.role = (token.role as 'USER' | 'ADMIN') ?? 'USER';
    session.user.profileCompleted = Boolean(token.profileCompleted);
    session.user.languagePref = (token.languagePref as 'BN' | 'EN') ?? 'BN';
    session.user.isBanned = Boolean(token.isBanned);
    // Carry OAuth profile fields from JWT → session so the navbar avatar
    // renders. next-auth v5 does not auto-propagate these through the
    // custom callbacks we wired; we have to copy them explicitly.
    if (typeof token.name === 'string') session.user.name = token.name;
    if (typeof token.image === 'string') session.user.image = token.image;
  }
  return session;
}

/**
 * signIn event — extracted for unit testing.
 * Fires AFTER the signIn callback succeeds.
 * - Always: updates lastLoginAt + logs USER_LOGIN.
 * - On fresh registration (lastLoginAt null AND createdAt within 60s):
 *   also logs USER_REGISTERED.
 */
export async function signInEvent({
  user,
  account,
}: {
  user: { email?: string | null };
  account?: { provider: string; providerAccountId?: string } | null;
}): Promise<void> {
  if (account?.provider !== 'google' || !user.email) return;

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, lastLoginAt: true, createdAt: true },
  });
  if (!dbUser) return;

  const isFreshRegistration =
    dbUser.lastLoginAt === null && Date.now() - dbUser.createdAt.getTime() < 60_000;

  await prisma.user.update({
    where: { id: dbUser.id },
    data: { lastLoginAt: new Date() },
  });
  await logSecurityEvent({ action: 'USER_LOGIN', userId: dbUser.id });

  if (isFreshRegistration) {
    await logSecurityEvent({
      action: 'USER_REGISTERED',
      userId: dbUser.id,
      details: {
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      },
    });
  }
}

/**
 * signOut event — extracted for unit testing.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function signOutEvent(message: any): Promise<void> {
  const token = 'token' in message ? message.token : null;
  if (token?.id) {
    await logSecurityEvent({ action: 'USER_LOGOUT', userId: token.id });
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: { prompt: 'consent', access_type: 'offline', response_type: 'code' },
      },
    }),
  ],
  callbacks: {
    signIn: signInCallback,
    jwt: jwtCallback,
    session: sessionCallback,
  },
  events: {
    signIn: signInEvent,
    signOut: signOutEvent,
  },
});
