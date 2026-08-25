const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

// TODO(monitoring-agent): wrap with `withSentryConfig` once @sentry/nextjs is configured.
// const { withSentryConfig } = require('@sentry/nextjs');

// TODO(perf-agent): wrap with bundle analyzer when running `ANALYZE=true pnpm build`.
// const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  // Image domains for avatars (Cloudflare R2, Google profile pics)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    formats: ['image/webp'],
  },

  // Security headers (CSP tightened — see i18n-agent.md)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },

  // Transpile some packages that ship untranspiled
  transpilePackages: ['next-intl'],
};

module.exports = withNextIntl(nextConfig);
// module.exports = withBundleAnalyzer(withSentryConfig(withNextIntl(nextConfig), { hideSourceMaps: true, disableLogger: true }));
