# CI/CD Pipeline Documentation

**Project:** Donation Platform (School Organization)
**Last Updated:** August 20, 2026

---

## 1. CI/CD Overview

### 1.1 Pipeline Stages

```
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│   Lint  │──▶│  Type   │──▶│  Test   │──▶│  Build  │──▶│  Scan   │──▶│  Push   │
│  Check  │   │  Check  │   │         │   │ Docker  │   │ Security│   │ Docker  │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
                                                                          │
                                                                          ▼
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ Notify  │◀──│   E2E   │◀──│ Deploy  │◀──│ Deploy  │
│  Slack  │   │  Tests  │   │ Staging │   │   Dev   │
└─────────┘   └─────────┘   └─────────┘   └─────────┘
```

### 1.2 Environments

| Environment | Branch | URL | Auto Deploy |
|-------------|--------|-----|-------------|
| Development | `develop` | dev.example.com | Yes |
| Staging | `staging` | staging.example.com | Yes |
| Production | `main` | example.com | Manual approval |

---

## 2. GitHub Actions Workflows

### 2.1 Main CI Workflow

**File:** `.github/workflows/ci.yml`

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop, staging]
  pull_request:
    branches: [main, develop, staging]

env:
  REGISTRY: docker.io
  IMAGE_NAME: yourusername/donation-platform

jobs:
  # ============================================
  # Stage 1: Lint and Type Check
  # ============================================
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run Prettier check
        run: npm run format:check

      - name: Run TypeScript check
        run: npm run type-check

  # ============================================
  # Stage 2: Unit Tests
  # ============================================
  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup Prisma
        run: npx prisma generate

      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test

      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379

      - name: Generate coverage report
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  # ============================================
  # Stage 3: E2E Tests
  # ============================================
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: test
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379

      - name: Start application
        run: npm run start &
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
          NEXT_PUBLIC_URL: http://localhost:3000

      - name: Wait for app to be ready
        run: npx wait-on http://localhost:3000

      - name: Run Playwright tests
        run: npx playwright test
        env:
          BASE_URL: http://localhost:3000

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

  # ============================================
  # Stage 4: Build Docker Image
  # ============================================
  build:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: e2e
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,format=short
            type=raw,value=latest,enable={{is_default_branch}}
            type=raw,value=develop,enable={{is_default_branch}}
        env:
          DOCKER_METADATA_ANNOTATIONS_DEBUG: true

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          push: ${{ github.event_name == 'push' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64

  # ============================================
  # Stage 5: Security Scan
  # ============================================
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Run npm audit
        run: npm audit --audit-level=high
```

---

### 2.2 Docker Hub Image Build

**File:** `.github/workflows/docker.yml`

```yaml
name: Docker Hub Image

on:
  push:
    branches: [main, develop, staging]
    tags: ['v*.*.*']
  workflow_dispatch:

env:
  REGISTRY: docker.io
  IMAGE_NAME: yourusername/donation-platform

jobs:
  build-and-push:
    name: Build & Push to Docker Hub
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Get version
        id: version
        run: echo "VERSION=$(git describe --tags --always --dirty)" >> $GITHUB_OUTPUT

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=tag
            type=sha,format=short
            type=raw,value=${{ steps.version.outputs.VERSION }}
            type=raw,value=latest,enable={{is_default_branch}}
            type=raw,value=develop,enable={{is_default_branch}}
            type=raw,value=staging,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64
          build-args: |
            BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
            VCS_REF=${{ github.sha }}
            VERSION=${{ steps.version.outputs.VERSION }}
```

---

### 2.3 Deploy to VPS

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to VPS

on:
  push:
    branches: [main, develop]
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to VPS
    runs-on: ubuntu-latest
    environment:
      name: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
      url: ${{ github.ref == 'refs/heads/main' && 'https://example.com' || 'https://staging.example.com' }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to VPS via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/donation-platform
            
            # Backup current state
            docker compose ps > before.txt
            
            # Pull latest images
            docker compose pull
            
            # Run database migrations
            docker compose run --rm app npx prisma migrate deploy
            
            # Restart services with zero downtime
            docker compose up -d --no-deps --build app
            docker compose up -d --no-deps nginx
            
            # Wait for health check
            sleep 10
            curl -f http://localhost:3000/api/health || exit 1
            
            # Clean up old images
            docker image prune -af
            
            # Show status
            docker compose ps
            echo "Deployment completed successfully!"

      - name: Notify Slack
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            Deployment ${{ job.status }} to ${{ github.ref_name }}
            Commit: ${{ github.sha }}
            Author: ${{ github.actor }}
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

### 2.4 Code Quality Checks

**File:** `.github/workflows/code-quality.yml`

```yaml
name: Code Quality

on:
  pull_request:
    branches: [main, develop]

jobs:
  quality:
    name: Code Quality Analysis
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: SonarCloud Scan
        uses: sonarcloud/github-action@v2
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        with:
          args: >
            -Dsonar.projectKey=donation-platform
            -Dsonar.organization=your-org
            -Dsonar.sources=src
            -Dsonar.tests=__tests__
            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info

      - name: Check bundle size
        run: |
          npm run build
          npm run analyze
          
          # Fail if bundle size exceeds limit
          SIZE=$(du -b .next/static/chunks/main-*.js | cut -f1)
          MAX_SIZE=209715  # 200KB
          if [ $SIZE -gt $MAX_SIZE ]; then
            echo "Bundle size exceeded: $SIZE bytes (max: $MAX_SIZE)"
            exit 1
          fi
```

---

## 3. Docker Configuration

### 3.1 Dockerfile (Multi-stage Build)

**File:** `Dockerfile`

```dockerfile
# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

# Build arguments
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# ============================================
# Stage 3: Runner (Production)
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Metadata
LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.version=$VERSION \
      org.label-schema.schema-version="1.0"

# Use non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

---

### 3.2 Docker Compose

**File:** `docker-compose.yml`

```yaml
version: '3.9'

services:
  # ============================================
  # Next.js Application
  # ============================================
  app:
    image: yourusername/donation-platform:latest
    container_name: donation-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://donation:donation@postgres:5432/donation
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_URL=https://example.com
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - BKASH_BASE_URL=${BKASH_BASE_URL}
      - BKASH_APP_KEY=${BKASH_APP_KEY}
      - BKASH_APP_SECRET=${BKASH_APP_SECRET}
      - BKASH_USERNAME=${BKASH_USERNAME}
      - BKASH_PASSWORD=${BKASH_PASSWORD}
      - R2_ACCOUNT_ID=${R2_ACCOUNT_ID}
      - R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}
      - R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}
      - R2_BUCKET_NAME=${R2_BUCKET_NAME}
      - SENTRY_DSN=${SENTRY_DSN}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - app-network
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # ============================================
  # PostgreSQL Database
  # ============================================
  postgres:
    image: postgres:16-alpine
    container_name: donation-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=donation
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=donation
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backups:/backups
      - ./scripts/init-db.sh:/docker-entrypoint-initdb.d/init-db.sh
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U donation"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # Redis Cache
  # ============================================
  redis:
    image: redis:7-alpine
    container_name: donation-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # Nginx Reverse Proxy
  # ============================================
  nginx:
    image: nginx:alpine
    container_name: donation-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - app
    networks:
      - app-network

  # ============================================
  # Certbot (SSL Certificates)
  # ============================================
  certbot:
    image: certbot/certbot
    container_name: donation-certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot:rw
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

volumes:
  postgres-data:
    driver: local
  redis-data:
    driver: local

networks:
  app-network:
    driver: bridge
```

---

### 3.3 Nginx Configuration

**File:** `nginx/nginx.conf`

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/atom+xml image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.bka.sh;" always;

    include /etc/nginx/conf.d/*.conf;
}
```

**File:** `nginx/conf.d/app.conf`

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name example.com www.example.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to Next.js app
    location / {
        limit_req zone=general burst=20 nodelay;
        
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=50 nodelay;
        
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://app:3000;
        proxy_cache_valid 200 365d;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # File upload limit
    client_max_body_size 10M;
}
```

---

## 4. Database Backup Strategy

### 4.1 Automated Backup Script

**File:** `scripts/backup-db.sh`

```bash
#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30
S3_BUCKET="s3://your-backup-bucket/database"

# Create backup
echo "Creating database backup..."
docker exec donation-postgres pg_dump -U donation donation | gzip > "$BACKUP_FILE"

# Verify backup
if [ ! -s "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file is empty!"
    exit 1
fi

# Upload to S3
echo "Uploading to S3..."
aws s3 cp "$BACKUP_FILE" "${S3_BUCKET}/"

# Remove old local backups
echo "Cleaning up old backups..."
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Remove old S3 backups
echo "Cleaning up old S3 backups..."
aws s3 ls "${S3_BUCKET}/" | while read -r line; do
    FILE_DATE=$(echo "$line" | awk '{print $1}')
    FILE_NAME=$(echo "$line" | awk '{print $4}')
    if [ -n "$FILE_NAME" ]; then
        FILE_AGE=$(($(date +%s) - $(date -d "$FILE_DATE" +%s)))
        if [ $FILE_AGE -gt $((RETENTION_DAYS * 86400)) ]; then
            aws s3 rm "${S3_BUCKET}/${FILE_NAME}"
        fi
    fi
done

echo "Backup completed: $BACKUP_FILE"
```

### 4.2 Backup Cron Job

```bash
# Add to crontab
0 2 * * * /opt/donation-platform/scripts/backup-db.sh >> /var/log/backup.log 2>&1
```

---

## 5. Deployment Workflow

### 5.1 Initial VPS Setup

**File:** `scripts/setup-vps.sh`

```bash
#!/bin/bash
set -e

echo "Setting up VPS for Donation Platform..."

# Update system
apt-get update
apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt-get install -y docker-compose-plugin

# Install Certbot
apt-get install -y certbot

# Create application directory
mkdir -p /opt/donation-platform
cd /opt/donation-platform

# Create necessary directories
mkdir -p nginx/conf.d certbot/conf certbot/www backups logs scripts

# Set up firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Create environment file
cat > .env <<EOF
# Database
POSTGRES_PASSWORD=your_secure_password

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://example.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# bKash
BKASH_BASE_URL=https://tokenized.pay.bka.sh/v1.2.0-beta
BKASH_APP_KEY=your_app_key
BKASH_APP_SECRET=your_app_secret
BKASH_USERNAME=your_username
BKASH_PASSWORD=your_password

# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=donation-platform

# Sentry
SENTRY_DSN=your_sentry_dsn
EOF

echo "VPS setup completed!"
echo "Next steps:"
echo "1. Edit .env file with your credentials"
echo "2. Run: docker compose up -d"
echo "3. Setup SSL: certbot certonly --webroot -w /var/www/certbot -d example.com"
```

---

### 5.2 Deployment Commands

```bash
# Initial deployment
cd /opt/donation-platform
docker compose pull
docker compose up -d

# Run migrations
docker compose exec app npx prisma migrate deploy

# View logs
docker compose logs -f app

# Restart services
docker compose restart app

# Update deployment
git pull origin main
docker compose pull
docker compose up -d

# Rollback
docker compose down
docker tag yourusername/donation-platform:latest yourusername/donation-platform:backup
docker pull yourusername/donation-platform:previous-tag
docker compose up -d
```

---

## 6. Monitoring & Alerts

### 6.1 Health Check Monitoring

**File:** `scripts/monitor.sh`

```bash
#!/bin/bash

# Check application health
HEALTH_URL="https://example.com/api/health"
SLACK_WEBHOOK="$1"

check_health() {
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")
    
    if [ "$RESPONSE" != "200" ]; then
        MESSAGE="🚨 Application is DOWN! HTTP Status: $RESPONSE"
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"$MESSAGE\"}"
        
        # Attempt auto-restart
        cd /opt/donation-platform
        docker compose restart app
    fi
}

# Check disk space
check_disk() {
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$DISK_USAGE" -gt 80 ]; then
        MESSAGE="⚠️ Disk usage high: ${DISK_USAGE}%"
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"$MESSAGE\"}"
    fi
}

# Check database
check_database() {
    DB_STATUS=$(docker exec donation-postgres pg_isready -U donation)
    
    if [ $? -ne 0 ]; then
        MESSAGE="🚨 Database is DOWN!"
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"$MESSAGE\"}"
    fi
}

check_health
check_disk
check_database
```

**Cron job:**
```bash
*/5 * * * * /opt/donation-platform/scripts/monitor.sh $SLACK_WEBHOOK_URL
```

---

## 7. Release Process

### 7.1 Release Checklist

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Database migrations tested
- [ ] Environment variables updated
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped (semver)
- [ ] Tag created
- [ ] Backup completed
- [ ] Deployment plan reviewed

### 7.2 Semantic Versioning

```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes
MINOR: New features (backward compatible)
PATCH: Bug fixes

Examples:
1.0.0 → Initial release
1.1.0 → New feature added
1.1.1 → Bug fix
2.0.0 → Breaking change
```

---

## 8. Secrets Management

### 8.1 GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_TOKEN` | Docker Hub access token |
| `VPS_HOST` | VPS IP address |
| `VPS_USER` | VPS SSH username |
| `VPS_SSH_KEY` | VPS SSH private key |
| `SLACK_WEBHOOK` | Slack notification webhook |
| `SONAR_TOKEN` | SonarCloud token |
| `CODECOV_TOKEN` | Codecov token |

### 8.2 Environment Variables

**File:** `.env.example`

```bash
# Application
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_URL=https://example.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/donation

# Redis
REDIS_URL=redis://localhost:6379

# NextAuth
NEXTAUTH_URL=https://example.com
NEXTAUTH_SECRET=generate_random_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# bKash Payment
BKASH_BASE_URL=https://tokenized.pay.bka.sh/v1.2.0-beta
BKASH_APP_KEY=your_app_key
BKASH_APP_SECRET=your_app_secret
BKASH_USERNAME=your_username
BKASH_PASSWORD=your_password

# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=donation-platform

# Sentry
SENTRY_DSN=your_sentry_dsn

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@example.com

# Logging
LOG_LEVEL=info
```

---

## 9. Performance Monitoring

### 9.1 Key Metrics to Track

- **Response Time:** API endpoint latency
- **Error Rate:** 5xx errors per minute
- **Throughput:** Requests per second
- **Database Performance:** Query execution time
- **Payment Success Rate:** Successful vs failed transactions
- **User Activity:** Active users, donations per hour
- **Resource Usage:** CPU, memory, disk, network

### 9.2 Alerting Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| App Down | Health check fails 3 times | Critical |
| High Error Rate | >5% errors in 5 minutes | High |
| Slow Response | P95 >2s for 5 minutes | Medium |
| Disk Full | >90% disk usage | High |
| Database Down | Connection fails 3 times | Critical |
| Payment Failures | >10% failure rate | High |

---

**Document Owner:** Md. Rifat Hossain
**Review Cycle:** Quarterly or when pipeline changes
