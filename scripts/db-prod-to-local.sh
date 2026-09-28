#!/usr/bin/env bash
# Dump PostgreSQL on VPS and restore into local Docker (docker compose).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=scripts/lib/vps-ssh.sh
source "$ROOT/scripts/lib/vps-ssh.sh"

BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP_FILE="$BACKUP_DIR/prod-${STAMP}.sql"
REMOTE_ENV="/opt/humiliation-game/apps/server/.env"

LOCAL_USER="${LOCAL_PG_USER:-game}"
LOCAL_PASS="${LOCAL_PG_PASSWORD:-game}"
LOCAL_DB="${LOCAL_PG_DB:-humiliation_game}"
LOCAL_HOST="${LOCAL_PG_HOST:-127.0.0.1}"
LOCAL_PORT="${LOCAL_PG_PORT:-5432}"

mkdir -p "$BACKUP_DIR"

echo "==> Local PostgreSQL (Docker)"
cd "$ROOT"
if ! docker compose ps postgres --status running -q 2>/dev/null | grep -q .; then
  docker compose up -d postgres
  echo "Waiting for postgres..."
  for _ in $(seq 1 30); do
    if docker compose exec -T postgres pg_isready -U "$LOCAL_USER" -d "$LOCAL_DB" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
fi

echo "==> Dump from $VPS_HOST"
"${SSH[@]}" "$VPS_HOST" "set -a && source '$REMOTE_ENV' && set +a && pg_dump \"\$DATABASE_URL\" --no-owner --no-acl --clean --if-exists" >"$DUMP_FILE"
echo "Saved: $DUMP_FILE ($(du -h "$DUMP_FILE" | awk '{print $1}'))"

echo "==> Restore to localhost:${LOCAL_PORT}/${LOCAL_DB}"
# Prod may run newer PostgreSQL (e.g. 18) than local Docker (16); strip unsupported dump directives.
sed -e '/^SET transaction_timeout/d' \
  -e '/^\\restrict /d' \
  -e '/^\\unrestrict /d' \
  "$DUMP_FILE" | docker compose exec -T postgres psql -U "$LOCAL_USER" -d "$LOCAL_DB" -v ON_ERROR_STOP=1

echo "==> Done. apps/server/.env should use:"
echo "DATABASE_URL=\"postgresql://${LOCAL_USER}:${LOCAL_PASS}@${LOCAL_HOST}:${LOCAL_PORT}/${LOCAL_DB}\""
