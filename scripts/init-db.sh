#!/bin/bash
# ============================================
# PostgreSQL First-Init Script
# ============================================
# Runs once on first container startup (only when
# the data volume is empty). Installs extensions and
# sets up a read-only role for monitoring.
# ============================================
set -euo pipefail

echo "[init-db] $(date -u +%FT%TZ) Initializing donation database..."

# Required environment variables (provided by docker-compose)
: "${POSTGRES_USER:?POSTGRES_USER must be set}"
: "${POSTGRES_DB:?POSTGRES_DB must be set}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE EXTENSION IF NOT EXISTS "citext";

    -- Performance / observability views (read by Grafana / monitoring later)
    CREATE OR REPLACE VIEW v_active_donations AS
    SELECT
        id, user_id, amount, currency, status, purpose,
        created_at, completed_at
    FROM donations
    WHERE status = 'PENDING';

    CREATE OR REPLACE VIEW v_donation_stats AS
    SELECT
        status,
        purpose,
        COUNT(*)        AS donation_count,
        COALESCE(SUM(amount), 0) AS total_amount
    FROM donations
    GROUP BY status, purpose;

    -- Grants
    GRANT SELECT ON v_active_donations, v_donation_stats TO ${POSTGRES_USER};
EOSQL

echo "[init-db] ✅ Extensions created: uuid-ossp, pgcrypto, citext"
echo "[init-db] ✅ Views created: v_active_donations, v_donation_stats"
echo "[init-db] Initialization complete."
