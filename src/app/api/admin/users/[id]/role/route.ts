/**
 * PATCH /api/admin/users/[id]/role — change a user's role (USER <-> ADMIN).
 *
 * Body: { role: 'USER' | 'ADMIN' }
 *
 * Side effects:
 *   - Update role
 *   - Bump tokenVersion on role change so the JWT reflects the new role on next request
 *   - Audit log ADMIN_ACTION with the role delta
 */
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { requireAdminTargetUser } from '@/lib/auth/admin-helpers';
import { ok, fail } from '@/lib/api/helpers';
import { rateLimit, requireRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { logSecurityEvent } from '@/lib/audit';
import { ValidationError } from '@/lib/errors';

const bodySchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    // Self-target + existence checks run BEFORE rate-limit so spamming your
    // own id doesn't burn the admin's quota.
    const target = await requireAdminTargetUser(id, session.user.id);

    const rl = await rateLimit(
      `admin:users:role:${session.user.id}`,
      RATE_LIMITS.ADMIN_ACTION.max,
      RATE_LIMITS.ADMIN_ACTION.windowSeconds
    );
    requireRateLimit(rl);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError('Invalid JSON body');
    }
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        new z.ZodError(parsed.error.issues.map((i) => ({ ...i, path: ['body', ...i.path] })))
      );
    }

    if (target.role === parsed.data.role) {
      return ok({ id: target.id, role: target.role, unchanged: true });
    }

    const previousRole = target.role;
    const updated = await prisma.user.update({
      where: { id: target.id },
      data: {
        role: parsed.data.role,
        tokenVersion: { increment: 1 },
      },
      select: { id: true, role: true },
    });

    await logSecurityEvent({
      action: 'ADMIN_ACTION',
      userId: target.id,
      resource: target.id,
      details: {
        kind: 'role_change',
        actorId: session.user.id,
        previousRole,
        newRole: parsed.data.role,
      },
    });

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}
