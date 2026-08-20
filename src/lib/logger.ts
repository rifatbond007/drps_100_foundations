/**
 * Pino structured logger.
 * Pretty-prints in development, JSON in production.
 */
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(process.env.NODE_ENV !== 'production'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l' },
        },
      }
    : {}),
  base: { service: 'donation-platform' },
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      '*.password',
      '*.token',
      '*.secret',
      '*.apiKey',
      'bkash.*',
    ],
    censor: '[REDACTED]',
  },
});
