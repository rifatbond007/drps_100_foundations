/**
 * Pino structured logger.
 * Pretty-prints in development when `pino-pretty` is installed, JSON otherwise.
 *
 * The `transport` config uses a `try/catch` via a function-wrapped object
 * so webpack still bundles the module path string (allowing pino to resolve
 * the worker thread target at runtime) but the app doesn't crash if the
 * package isn't installed. We avoid `require('pino-pretty')` at the top of
 * the file because that would fail the build outright on Edge/Node bundles
 * where pino-pretty isn't needed and isn't a dependency.
 *
 * Note: pino transports run in a worker thread — they cannot be bundled by
 * webpack/Next.js. Set `target: 'pino-pretty'` only when the package is
 * resolvable; otherwise fall back to plain JSON output (still readable).
 */
import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';

const pinoConfig: pino.LoggerOptions = {
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
};

// Only attach the pino-pretty transport in dev when it's resolvable.
// In production we always emit JSON so log aggregators can parse it.
if (!isProd) {
  try {
    // Use require so webpack doesn't try to statically resolve this module.
    // If pino-pretty isn't installed, the require throws and we fall back
    // to plain JSON output.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require.resolve('pino-pretty');
    pinoConfig.transport = {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l' },
    };
  } catch {
    // pino-pretty not installed — fall back to JSON. Log once so the
    // developer knows pretty output would have been nicer.
    // eslint-disable-next-line no-console
    console.warn(
      '[logger] pino-pretty is not installed; falling back to JSON output. ' +
        'Run `pnpm add -D pino-pretty` for colorized dev logs.'
    );
  }
}

export const logger = pino(pinoConfig);
