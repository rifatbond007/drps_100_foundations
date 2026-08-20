# Project Structure & Setup Guide

**Project:** Donation Platform (School Organization)
**Last Updated:** August 20, 2026

---

## 1. Complete Project Structure

```
donation-platform/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                      # Main CI pipeline
│   │   ├── docker.yml                  # Docker Hub build
│   │   ├── deploy.yml                  # VPS deployment
│   │   └── code-quality.yml            # Code quality checks
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── PULL_REQUEST_TEMPLATE.md
├── prisma/
│   ├── schema.prisma                   # Database schema
│   ├── migrations/                     # Migration files
│   └── seed.ts                         # Database seeding
├── public/
│   ├── images/
│   ├── icons/
│   └── locales/                        # Static translations
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (public)/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── about/
│   │   │   │   ├── login/
│   │   │   │   └── layout.tsx
│   │   │   ├── (authenticated)/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── donate/
│   │   │   │   ├── history/
│   │   │   │   ├── settings/
│   │   │   │   └── layout.tsx
│   │   │   └── admin/
│   │   │       ├── users/
│   │   │       ├── reports/
│   │   │       └── layout.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── donations/
│   │   │   ├── users/
│   │   │   ├── admin/
│   │   │   ├── webhooks/
│   │   │   └── health/
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   ├── forms/
│   │   ├── layout/
│   │   ├── auth/
│   │   ├── donation/
│   │   └── admin/
│   ├── lib/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── payment/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── hooks/
│   │   ├── errors.ts
│   │   ├── logger.ts
│   │   └── redis.ts
│   ├── types/
│   ├── styles/
│   └── middleware.ts
├── scripts/
│   ├── backup-db.sh                    # Database backup
│   ├── restore-db.sh                   # Database restore
│   ├── setup-vps.sh                    # VPS setup
│   └── monitor.sh                      # Health monitoring
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
│       └── app.conf
├── certbot/
│   ├── conf/
│   └── www/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│       ├── donation-flow.spec.ts
│       ├── auth.spec.ts
│       └── admin.spec.ts
├── docs/
│   ├── ARCHITECTURE.md
│   ├── FRONTEND_PLANNING.md
│   ├── BACKEND_PLANNING.md
│   ├── CI_CD_PIPELINE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── TROUBLESHOOTING.md
├── .env.example
├── .env.local                          # Local development
├── .eslintrc.json
├── .prettierrc
├── .gitignore
├── docker-compose.yml
├── docker-compose.dev.yml
├── Dockerfile
├── next.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── playwright.config.ts
├── vitest.config.ts
└── README.md
```

---

## 2. Initial Setup Commands

### 2.1 Create Next.js Project

```bash
# Create Next.js app with TypeScript and Tailwind
npx create-next-app@latest donation-platform \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm \
  --no-eslint

cd donation-platform

# Install core dependencies
npm install \
  next@latest \
  react@latest \
  react-dom@latest \
  typescript \
  @types/node \
  @types/react \
  @types/react-dom

# Install Prisma
npm install prisma @prisma/client

# Install NextAuth
npm install next-auth@beta @auth/prisma-adapter

# Install UI libraries
npm install \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-select \
  @radix-ui/react-toast \
  class-variance-authority \
  clsx \
  tailwind-merge \
  lucide-react

# Install forms and validation
npm install \
  react-hook-form \
  @hookform/resolvers \
  zod

# Install i18n
npm install next-intl

# Install utilities
npm install \
  date-fns \
  @tanstack/react-query \
  zustand \
  recharts

# Install backend utilities
npm install \
  ioredis \
  pino \
  pino-pretty \
  bcryptjs \
  @types/bcryptjs

# Install payment SDK
npm install axios

# Install file upload
npm install \
  @aws-sdk/client-s3 \
  @aws-sdk/s3-request-presigner

# Install email
npm install nodemailer @types/nodemailer @sendgrid/mail

# Install error tracking
npm install @sentry/nextjs

# Install dev dependencies
npm install -D \
  eslint \
  prettier \
  eslint-config-next \
  @types/eslint \
  vitest \
  @vitest/ui \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jsdom \
  @playwright/test \
  husky \
  lint-staged \
  @commitlint/cli \
  @commitlint/config-conventional \
  @next/bundle-analyzer \
  ts-node
```

---

### 2.2 Initialize Prisma

```bash
# Initialize Prisma
npx prisma init

# Generate Prisma Client
npx prisma generate

# Create initial migration
npx prisma migrate dev --name init

# Seed database
npx prisma db seed
```

---

### 2.3 Setup Git Hooks

```bash
# Initialize Husky
npx husky init

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run type-check && npm run test:unit"

# Add commit-msg hook
npx husky add .husky/commit-msg 'npx --no-install commitlint --edit "$1"'
```

---

## 3. Configuration Files

### 3.1 package.json Scripts

```json
{
  "name": "donation-platform",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "type-check": "tsc --noEmit",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:unit:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:all": "npm run test:unit && npm run test:e2e",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "prisma:seed": "ts-node prisma/seed.ts",
    "db:backup": "bash scripts/backup-db.sh",
    "db:restore": "bash scripts/restore-db.sh",
    "docker:dev": "docker compose -f docker-compose.dev.yml up",
    "docker:dev:down": "docker compose -f docker-compose.dev.yml down",
    "docker:prod": "docker compose up -d",
    "docker:logs": "docker compose logs -f",
    "prepare": "husky"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@prisma/client": "^5.20.0",
    "next-auth": "^5.0.0-beta",
    "@auth/prisma-adapter": "^2.7.0",
    "zod": "^3.23.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "next-intl": "^3.20.0",
    "@tanstack/react-query": "^5.59.0",
    "zustand": "^5.0.0",
    "ioredis": "^5.4.1",
    "pino": "^9.5.0",
    "pino-pretty": "^11.3.0",
    "@aws-sdk/client-s3": "^3.668.0",
    "@sentry/nextjs": "^8.30.0",
    "lucide-react": "^0.451.0",
    "recharts": "^2.13.0",
    "date-fns": "^4.1.0",
    "axios": "^1.7.0",
    "nodemailer": "^6.9.0",
    "@sendgrid/mail": "^8.1.0",
    "tailwind-merge": "^2.5.0",
    "clsx": "^2.1.0",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.7.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/nodemailer": "^6.4.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "prettier": "^3.3.0",
    "prisma": "^5.20.0",
    "vitest": "^2.1.0",
    "@vitest/ui": "^2.1.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/user-event": "^14.5.0",
    "jsdom": "^25.0.0",
    "@playwright/test": "^1.48.0",
    "husky": "^9.1.0",
    "lint-staged": "^15.2.0",
    "@commitlint/cli": "^19.5.0",
    "@commitlint/config-conventional": "^19.5.0",
    "@next/bundle-analyzer": "^15.0.0",
    "ts-node": "^10.9.0"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  },
  "commitlint": {
    "extends": ["@commitlint/config-conventional"]
  }
}
```

---

### 3.2 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    },
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

### 3.3 next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Output standalone for Docker
  output: 'standalone',
  
  // Sentry configuration
  sentry: {
    hideSourceMaps: true,
    disableLogger: true,
  },
  
  // Bundle analyzer
  bundleAnalyzer: {
    enabled: process.env.ANALYZE === 'true',
  },
  
  // Image optimization
  images: {
    domains: ['example.com', 'r2.example.com'],
    formats: ['image/webp'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'no-referrer-when-downgrade',
          },
        ],
      },
    ];
  },
  
  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
};

module.exports = nextConfig;
```

---

### 3.4 tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E2136E',
          dark: '#B10E58',
          light: '#FF4B91',
        },
        secondary: {
          DEFAULT: '#006A4E',
          dark: '#004D3A',
          light: '#00876B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        bn: ['Noto Sans Bengali', 'Kalpurush', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

---

### 3.5 .eslintrc.json

```json
{
  "extends": [
    "next/core-web-vitals",
    "next/typescript"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "react/no-unescaped-entities": "off",
    "prefer-const": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

---

### 3.6 .prettierrc

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

---

### 3.7 .gitignore

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Next.js
.next/
out/
build/
dist/

# Production
*.tgz

# Misc
.DS_Store
*.pem
.vscode/
.idea/

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Prisma
prisma/migrations/dev/

# Docker
docker-compose.override.yml

# Logs
logs/
*.log

# Backups
backups/*.sql.gz
```

---

## 4. Initial Files to Create

### 4.1 NextAuth Configuration

**File:** `src/lib/auth/next-auth.ts`

```typescript
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.profileCompleted = (user as any).profileCompleted;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).profileCompleted = token.profileCompleted;
      }
      return session;
    },
  },
});
```

---

### 4.2 Prisma Client Singleton

**File:** `src/lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

### 4.3 Redis Client

**File:** `src/lib/redis.ts`

```typescript
import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
```

---

### 4.4 Middleware

**File:** `src/middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/next-auth';
import createIntlMiddleware from 'next-intl/middleware';

const intlMiddleware = createIntlMiddleware({
  locales: ['bn', 'en'],
  defaultLocale: 'bn',
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply i18n middleware
  const intlResponse = intlMiddleware(request);

  // Auth check for protected routes
  if (pathname.includes('/dashboard') || pathname.includes('/admin')) {
    const session = await auth();
    if (!session) {
      const locale = pathname.split('/')[1] || 'bn';
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }

  // Admin role check
  if (pathname.includes('/admin') && pathname.includes('/api')) {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return intlResponse;
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)', '/api/:path*'],
};
```

---

## 5. Development Workflow

### 5.1 Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/yourusername/donation-platform.git
cd donation-platform

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env.local

# 4. Edit .env.local with your credentials
nano .env.local

# 5. Start Docker services (Postgres + Redis)
npm run docker:dev

# 6. Run database migrations
npm run prisma:migrate

# 7. Seed database (optional)
npm run prisma:seed

# 8. Start development server
npm run dev

# 9. Open browser
# http://localhost:3000
```

---

### 5.2 Development Commands

```bash
# Start development
npm run dev

# Run tests
npm run test:unit
npm run test:e2e

# Lint and format
npm run lint
npm run format

# Database operations
npm run prisma:studio    # Open Prisma Studio
npm run prisma:migrate   # Create migration
npm run prisma:generate  # Generate Prisma Client

# Docker operations
npm run docker:dev       # Start dev environment
npm run docker:logs      # View logs

# Build for production
npm run build
npm run start
```

---

## 6. Deployment Checklist

### 6.1 Pre-Deployment

- [ ] All tests passing (unit + E2E)
- [ ] Code coverage >80%
- [ ] Linting passing
- [ ] Type checking passing
- [ ] Security scan passing
- [ ] Bundle size within limits
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Backup strategy in place

### 6.2 Deployment Steps

```bash
# 1. Build and push Docker image
docker build -t yourusername/donation-platform:v1.0.0 .
docker push yourusername/donation-platform:v1.0.0

# 2. SSH to VPS
ssh user@vps-ip

# 3. Pull latest image
cd /opt/donation-platform
docker compose pull

# 4. Run migrations
docker compose run --rm app npx prisma migrate deploy

# 5. Restart services
docker compose up -d

# 6. Verify deployment
curl https://example.com/api/health

# 7. Monitor logs
docker compose logs -f --tail=100
```

---

## 7. Post-Deployment

### 7.1 Verification

```bash
# Health check
curl https://example.com/api/health

# Check application logs
docker compose logs app

# Check database
docker compose exec postgres psql -U donation -d donation -c "SELECT COUNT(*) FROM users;"

# Check Redis
docker compose exec redis redis-cli ping

# Test donation flow
# (manually test in browser)

# Monitor metrics
# Check Grafana dashboard
```

---

## 8. Useful Commands Reference

### 8.1 Docker Commands

```bash
# View running containers
docker ps

# View all containers
docker ps -a

# View logs
docker compose logs -f app
docker compose logs --tail=100 app

# Execute command in container
docker compose exec app bash
docker compose exec postgres psql -U donation

# Restart service
docker compose restart app

# Stop all services
docker compose down

# Remove all containers and volumes
docker compose down -v

# View resource usage
docker stats

# Clean up unused images
docker image prune -a
```

---

### 8.2 Database Commands

```bash
# Connect to database
docker compose exec postgres psql -U donation -d donation

# Backup database
docker compose exec postgres pg_dump -U donation donation > backup.sql

# Restore database
cat backup.sql | docker compose exec -T postgres psql -U donation -d donation

# View database size
docker compose exec postgres psql -U donation -d donation -c "SELECT pg_size_pretty(pg_database_size('donation'));"

# View active connections
docker compose exec postgres psql -U donation -d donation -c "SELECT * FROM pg_stat_activity;"
```

---

### 8.3 Redis Commands

```bash
# Connect to Redis
docker compose exec redis redis-cli

# View all keys
docker compose exec redis redis-cli KEYS '*'

# Get specific key
docker compose exec redis redis-cli GET "key:name"

# Clear all data
docker compose exec redis redis-cli FLUSHALL

# View memory usage
docker compose exec redis redis-cli INFO memory
```

---

**Document Owner:** Md. Rifat Hossain
**Last Updated:** August 20, 2026
