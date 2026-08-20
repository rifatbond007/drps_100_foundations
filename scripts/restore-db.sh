#!/bin/bash
# ============================================
# Database Restore Script
# ============================================
# Restores a compressed PostgreSQL dump. DESTRUCTIVE —
# drops and recreates the database before loading.
#
# Usage:
#   ./scripts/restore-db.sh /backups/backup_20260820_020000.sql.gz
#
# Required env vars (or defaults):
#   COMPOSE_DIR  — directory containing docker-compose.yml
#   POSTGRES_USER (default: donation)
#   POSTGRES_DB   (default: donation)
# ============================================
set -euo pipefail

# ---------- Configuration ----------
COMPOSE_DIR="${COMPOSE_DIR:-/opt/donation-platform}"
POSTGRES_USER="${POSTGRES_USER:-donation}"
POSTGRES_DB="${POSTGRES_DB:-donation}"
POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
APP_SERVICE="${APP_SERVICE:-app}"

BACKUP_FILE="${1:-}"

# ---------- Validate input ----------
if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  echo "Example: $0 /backups/backup_20260820_020000.sql.gz"
  exit 2
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 2
fi

if [ ! -s "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file is empty: $BACKUP_FILE"
  exit 2
fi

# Validate gzip integrity before doing anything destructive
if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
  echo "ERROR: Backup file failed gzip integrity check"
  exit 2
fi

# Verify compose dir exists
if [ ! -d "$COMPOSE_DIR" ] || [ ! -f "$COMPOSE_DIR/docker-compose.yml" ]; then
  echo "ERROR: docker-compose.yml not found in $COMPOSE_DIR"
  echo "Set COMPOSE_DIR or run from /opt/donation-platform"
  exit 2
fi

cd "$COMPOSE_DIR"

echo "WARNING: This will DROP and RECREATE the database '${POSTGRES_DB}'."
echo "Backup file: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
echo ""
read -r -p "Type 'yes' to continue: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

echo "Stopping app to release DB connections..."
docker compose stop "$APP_SERVICE" || true

echo "Dropping database '${POSTGRES_DB}'..."
docker compose exec -T "$POSTGRES_SERVICE" \
  psql -U "$POSTGRES_USER" -d postgres \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${POSTGRES_DB}' AND pid <> pg_backend_pid();" \
  -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};"

echo "Creating fresh database '${POSTGRES_DB}'..."
docker compose exec -T "$POSTGRES_SERVICE" \
  psql -U "$POSTGRES_USER" -d postgres \
  -c "CREATE DATABASE ${POSTGRES_DB};"

echo "Restoring from backup..."
gunzip -c "$BACKUP_FILE" \
  | docker compose exec -T "$POSTGRES_SERVICE" \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        -v ON_ERROR_STOP=1

echo "Restarting app..."
docker compose start "$APP_SERVICE"

echo "Database restored successfully from: $BACKUP_FILE"
