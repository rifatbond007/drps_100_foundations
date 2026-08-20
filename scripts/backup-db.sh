#!/bin/bash
# ============================================
# Database Backup Script
# ============================================
# Creates a compressed PostgreSQL dump, verifies it,
# uploads to S3, and prunes old backups (local + S3).
#
# Usage:
#   ./scripts/backup-db.sh                  # uses defaults
#   BACKUP_DIR=/var/backups ./scripts/backup-db.sh
#
# Required env vars (or set in .env sourced by cron):
#   POSTGRES_USER (default: donation)
#   POSTGRES_DB   (default: donation)
#   S3_BUCKET     (required for upload)
#   AWS_REGION    (default: ap-southeast-1)
# ============================================
set -euo pipefail

# ---------- Configuration ----------
POSTGRES_USER="${POSTGRES_USER:-donation}"
POSTGRES_DB="${POSTGRES_DB:-donation}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-donation-postgres}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-}"   # e.g. s3://your-bucket/db-backups
AWS_REGION="${AWS_REGION:-ap-southeast-1}"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql.gz"
LOG_PREFIX="[backup-db]"

# ---------- Helpers ----------
log()   { echo "${LOG_PREFIX} $(date '+%F %T') $*"; }
fail()  { log "ERROR: $*"; exit 1; }

# ---------- Pre-flight ----------
command -v docker >/dev/null 2>&1 || fail "docker not found in PATH"
command -v gzip   >/dev/null 2>&1 || fail "gzip not found in PATH"

if [ -n "$S3_BUCKET" ]; then
  command -v aws >/dev/null 2>&1 || fail "aws cli not found (required for S3_BUCKET=$S3_BUCKET)"
fi

if ! docker ps --format '{{.Names}}' | grep -q "^${POSTGRES_CONTAINER}$"; then
  fail "Container '${POSTGRES_CONTAINER}' is not running"
fi

mkdir -p "$BACKUP_DIR"
[ -w "$BACKUP_DIR" ] || fail "Backup dir '$BACKUP_DIR' is not writable"

# ---------- Dump ----------
log "Dumping database '${POSTGRES_DB}' from container '${POSTGRES_CONTAINER}'..."
if ! docker exec "${POSTGRES_CONTAINER}" \
     pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --clean --if-exists \
     | gzip > "$BACKUP_FILE"; then
  rm -f "$BACKUP_FILE"
  fail "pg_dump failed"
fi

# ---------- Verify ----------
if [ ! -s "$BACKUP_FILE" ]; then
  rm -f "$BACKUP_FILE"
  fail "Backup file is empty after dump"
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# Quick integrity check — gzip should be valid
if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
  rm -f "$BACKUP_FILE"
  fail "Backup file failed gzip integrity check"
fi

# ---------- Upload to S3 ----------
if [ -n "$S3_BUCKET" ]; then
  log "Uploading to S3: ${S3_BUCKET}/"
  AWS_REGION="$AWS_REGION" aws s3 cp "$BACKUP_FILE" "${S3_BUCKET}/${TIMESTAMP}/" \
    || log "WARNING: S3 upload failed (continuing)"
fi

# ---------- Prune local backups ----------
log "Pruning local backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -maxdepth 1 -name "backup_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete -print \
  || log "WARNING: local prune failed (continuing)"

# ---------- Prune S3 backups ----------
if [ -n "$S3_BUCKET" ]; then
  log "Pruning S3 backups older than ${RETENTION_DAYS} days..."
  CUTOFF_EPOCH=$(( $(date +%s) - RETENTION_DAYS * 86400 ))
  AWS_REGION="$AWS_REGION" aws s3 ls "${S3_BUCKET}/" 2>/dev/null \
    | while read -r line; do
        FILE_DATE=$(echo "$line" | awk '{print $1}')
        FILE_NAME=$(echo "$line" | awk '{print $4}')
        [ -z "$FILE_NAME" ] && continue
        FILE_EPOCH=$(date -d "$FILE_DATE" +%s 2>/dev/null || echo 0)
        if [ "$FILE_EPOCH" -lt "$CUTOFF_EPOCH" ]; then
          AWS_REGION="$AWS_REGION" aws s3 rm "${S3_BUCKET}/${FILE_NAME}" >/dev/null \
            || log "WARNING: failed to delete ${FILE_NAME}"
        fi
      done || log "WARNING: S3 prune failed (continuing)"
fi

log "Backup completed successfully"
exit 0
