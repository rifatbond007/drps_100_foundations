/**
 * Audit logging.
 * Every security-sensitive action should call logSecurityEvent().
 * Never blocks the calling code (errors swallowed + logged).
 */
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface SecurityEvent {
  action: string;
  userId?: string;
  resource?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

const SENSITIVE_ACTIONS = new Set([
  'USER_LOGIN',
  'USER_LOGOUT',
  'USER_BANNED',
  'USER_UNBANNED',
  'USER_REGISTERED',
  'PROFILE_COMPLETED',
  'PROFILE_UPDATED',
  'SETTINGS_UPDATED',
  'LOGIN_BLOCKED',
  'DONATION_INITIATED',
  'DONATION_COMPLETED',
  'DONATION_FAILED',
  'ADMIN_ACTION',
  'RATE_LIMIT_EXCEEDED',
  'UNAUTHORIZED_API_ACCESS',
  'VALIDATION_FAILURE',
]);

function sanitizeDetails(details?: Record<string, unknown>): Record<string, unknown> {
  if (!details) return {};
  const sensitiveKeys = ['password', 'token', 'secret', 'apikey', 'credit_card', 'cvv'];
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      out[key] = '[REDACTED]';
    } else {
      out[key] = value;
    }
  }
  return out;
}

export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: event.action,
        userId: event.userId,
        resource: event.resource,
        ipAddress: event.ip,
        userAgent: event.userAgent,
        details: sanitizeDetails(event.details) as never,
      },
    });

    if (SENSITIVE_ACTIONS.has(event.action)) {
      logger.warn({ event }, `Security: ${event.action}`);
    }
  } catch (error) {
    logger.error({ error, event }, 'Audit logging failed');
  }
}
