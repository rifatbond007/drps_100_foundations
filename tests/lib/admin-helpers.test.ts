/**
 * Tests for the shared admin target-user helpers used by /api/admin/users/[id]/*.
 *
 * Verifies:
 *  - cuid validation rejects malformed ids (ValidationError)
 *  - self-targeting is refused (ConflictError) so admins cannot ban themselves
 *  - soft-deleted users resolve to NotFoundError
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors';

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));

import { requireAdminTargetUser, userIdSchema } from '@/lib/auth/admin-helpers';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('userIdSchema', () => {
  it('accepts a valid cuid', () => {
    expect(userIdSchema.safeParse('cm1234567890abcdefghijklmn').success).toBe(true);
  });
  it('rejects garbage', () => {
    expect(userIdSchema.safeParse('not-a-cuid').success).toBe(false);
    expect(userIdSchema.safeParse('').success).toBe(false);
    expect(userIdSchema.safeParse('123').success).toBe(false);
  });
});

describe('requireAdminTargetUser', () => {
  const actorId = 'cmactor0000000000000000000';
  const targetId = 'cmtarget000000000000000000';

  it('throws ValidationError on non-cuid id', async () => {
    await expect(requireAdminTargetUser('garbage', actorId)).rejects.toBeInstanceOf(
      ValidationError
    );
    expect(mocks.prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('throws ConflictError when actor == target (self-action prevention)', async () => {
    await expect(requireAdminTargetUser(actorId, actorId)).rejects.toBeInstanceOf(ConflictError);
    expect(mocks.prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when user does not exist', async () => {
    mocks.prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(requireAdminTargetUser(targetId, actorId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws NotFoundError when user is soft-deleted', async () => {
    mocks.prisma.user.findUnique.mockResolvedValueOnce({
      id: targetId,
      role: 'USER',
      isBanned: false,
      deletedAt: new Date(),
      email: 'x@x.com',
    });
    await expect(requireAdminTargetUser(targetId, actorId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns the user when present, active, and not the actor', async () => {
    const userRow = {
      id: targetId,
      role: 'USER',
      isBanned: false,
      deletedAt: null,
      email: 'x@x.com',
    };
    mocks.prisma.user.findUnique.mockResolvedValueOnce(userRow);
    await expect(requireAdminTargetUser(targetId, actorId)).resolves.toEqual(userRow);
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: targetId },
      select: {
        id: true,
        role: true,
        isBanned: true,
        deletedAt: true,
        email: true,
      },
    });
  });
});
