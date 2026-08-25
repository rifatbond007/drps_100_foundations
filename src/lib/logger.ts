/**
 * Pino structured logger.
 *
 * Always emits JSON — both in dev and production. The previous version
 * configured `transport: { target: 'pino-pretty' }` for dev, but pino
 * transports run in a separate worker thread and Next.js's webpack
 * bundler doesn't ship the worker chunk to `.next/server/vendor-chunks/`,
 * so the worker fails with MODULE_NOT_FOUND on every request and pino
 * logs `the worker thread exited` repeatedly.
 *
 * For local readability, pipe `pnpm dev`'s stdout through pino-pretty
 * directly:
 *
 *   pnpm dev | pino-pretty -c -t
 *
 * That gives the same colorized output without coupling the runtime
 * worker path to the bundler.
 */
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
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
