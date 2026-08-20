#!/bin/bash
# ============================================
# Health Monitoring Script
# ============================================
# Checks app health, disk usage, and DB status.
# Sends Slack alerts on failure.
#
# Usage:
#   ./scripts/monitor.sh [SLACK_WEBHOOK_URL]
#
# Env overrides:
#   HEALTH_URL       — default https://example.com/api/health
#   DISK_THRESHOLD   — default 80 (percent)
#   COMPOSE_DIR      — default /opt/donation-platform
#   POSTGRES_CONTAINER — default donation-postgres
#   POSTGRES_USER    — default donation
# ============================================
set -euo pipefail

HEALTH_URL="${HEALTH_URL:-https://example.com/api/health}"
DISK_THRESHOLD="${DISK_THRESHOLD:-80}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/donation-platform}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-donation-postgres}"
POSTGRES_USER="${POSTGRES_USER:-donation}"
SLACK_WEBHOOK="${1:-${SLACK_WEBHOOK_URL:-}}"

LOG_PREFIX="[monitor]"
FAILED=0

log()   { echo "${LOG_PREFIX} $(date '+%F %T') $*"; }
fail()  { log "$*"; FAILED=1; }
alert() {
  local msg="$1"
  log "ALERT: $msg"
  if [ -n "$SLACK_WEBHOOK" ]; then
    # Escape quotes for JSON
    local escaped
    escaped=$(printf '%s' "$msg" | sed 's/"/\\"/g')
    curl -sS --max-time 10 \
      -X POST "$SLACK_WEBHOOK" \
      -H 'Content-Type: application/json' \
      --data "{\"text\": \"$escaped\"}" \
      >/dev/null || log "WARNING: Slack notification failed"
  fi
}

# ---------- App health ----------
check_health() {
  log "Checking app health: $HEALTH_URL"
  local code
  code=$(curl -sS --max-time 15 -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then
    log "✅ App healthy (HTTP $code)"
  else
    fail "App unhealthy (HTTP $code)"
    alert "🚨 Donation app health check failed: HTTP $code"
    # Attempt auto-restart if compose dir is reachable
    if [ -d "$COMPOSE_DIR" ] && [ -f "$COMPOSE_DIR/docker-compose.yml" ]; then
      log "Attempting auto-restart in $COMPOSE_DIR..."
      (cd "$COMPOSE_DIR" && docker compose restart app) \
        || log "WARNING: auto-restart failed"
    fi
  fi
}

# ---------- Disk ----------
check_disk() {
  log "Checking disk usage..."
  local usage
  usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
  if [ "${usage:-0}" -gt "$DISK_THRESHOLD" ]; then
    fail "Disk usage high: ${usage}%"
    alert "⚠️ Disk usage high: ${usage}% (threshold ${DISK_THRESHOLD}%)"
  else
    log "✅ Disk usage OK: ${usage}%"
  fi
}

# ---------- Database ----------
check_database() {
  log "Checking database..."
  if docker exec "$POSTGRES_CONTAINER" \
       pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; then
    log "✅ Database ready"
  else
    fail "Database not ready"
    alert "🚨 Database (${POSTGRES_CONTAINER}) is DOWN!"
  fi
}

# ---------- Run all ----------
check_health
check_disk
check_database

if [ "$FAILED" -ne 0 ]; then
  log "One or more checks failed"
  exit 1
fi
log "All checks passed"
exit 0
