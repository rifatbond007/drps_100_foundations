# syntax=docker/dockerfile:1.7
# ============================================
# Donation Platform — Multi-Stage Production Build
# ============================================
# Build args (set by CI):
#   BUILD_DATE — ISO 8601 timestamp
#   VCS_REF    — git commit SHA
#   VERSION    — semver tag
# ============================================

# ============================================
# Stage 1: Dependencies (production-only)
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app

# pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9 --activate

# Install OS deps needed for native modules (e.g. Prisma engines)
RUN apk add --no-cache libc6-compat openssl

# Copy lockfile + manifest
COPY package.json pnpm-lock.yaml .npmrc* ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm fetch && \
    pnpm install --frozen-lockfile --prod

# ============================================
# Stage 2: Builder (devDeps + build)
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate
RUN apk add --no-cache libc6-compat openssl

# Build-time metadata
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

# Install all deps (including dev)
COPY package.json pnpm-lock.yaml .npmrc* ./
COPY --from=deps /app/node_modules ./node_modules
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm build

# ============================================
# Stage 3: Runner (production)
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache dumb-init openssl curl

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy built artifacts (output tracing required for standalone)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Metadata labels
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION
LABEL org.opencontainers.image.title="donation-platform" \
      org.opencontainers.image.description="School organization donation platform" \
      org.opencontainers.image.created=$BUILD_DATE \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.version=$VERSION \
      org.opencontainers.image.source="https://github.com/riftbond007/donation-platform" \
      org.opencontainers.image.licenses="MIT"

USER nextjs

EXPOSE 3000

# Health check via /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS --max-time 4 http://localhost:3000/api/health || exit 1

# Use dumb-init for proper signal handling (SIGTERM → graceful shutdown)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
