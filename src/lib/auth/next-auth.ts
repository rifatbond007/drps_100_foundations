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
    async signIn({ user, account }) {
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
      // is still blocked on re-sign-in. The previous code read `existing`
      // BEFORE the create, so a deleted-banned re-register slipped past.
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
    },
    async jwt({ token, user }) {
      // H3: guard against undefined token.id on early invokes
      if (!token.id && !user?.email) return token;

      // First sign-in: load fresh user data
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
          },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.profileCompleted = dbUser.profileCompleted;
          token.languagePref = dbUser.languagePref;
          token.isBanned = dbUser.isBanned;
          token.tokenVersion = dbUser.tokenVersion ?? 0;
        }
        return token;
      }

      // H2: re-check ban + tokenVersion on every refresh, BUT cap DB lookups.
      // Throttle to at most once per 60 seconds per token.
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
        },
      });

      // Soft-deleted users get booted
      if (!dbUser || dbUser.deletedAt) {
        return {} as typeof token;
      }

      // Banned mid-session: invalidate
      if (dbUser.isBanned) {
        return {} as typeof token;
      }

      // Bump on tokenVersion change (admin "log out all sessions")
      const storedVersion = (token.tokenVersion as number | undefined) ?? 0;
      if ((dbUser.tokenVersion ?? 0) > storedVersion) {
        return {} as typeof token;
      }

      // Refresh mutable fields
      token.isBanned = dbUser.isBanned;
      token.role = dbUser.role;
      token.profileCompleted = dbUser.profileCompleted;
      token.languagePref = dbUser.languagePref;

      return token;
    },
    async session({ session, token }) {
      // H3: bail if token has been invalidated (ban/delete/version bump)
      if (!token.id) return session;

      if (session.user) {
        session.user.id = token.id;
        session.user.role = (token.role as 'USER' | 'ADMIN') ?? 'USER';
        session.user.profileCompleted = Boolean(token.profileCompleted);
        session.user.languagePref = (token.languagePref as 'BN' | 'EN') ?? 'BN';
        session.user.isBanned = Boolean(token.isBanned);
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (dbUser) {
          await prisma.user.update({ where: { id: dbUser.id }, data: { lastLoginAt: new Date() } });
          await logSecurityEvent({ action: 'USER_LOGIN', userId: dbUser.id });
        }
      }
    },
    async signOut(message) {
      const token = 'token' in message ? message.token : null;
      if (token?.id) {
        await logSecurityEvent({ action: 'USER_LOGOUT', userId: token.id as string });
      }
    },
  },
});
