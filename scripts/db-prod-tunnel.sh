#!/usr/bin/env bash
# Forward local port to PostgreSQL on the VPS (bound to localhost on the server only).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=scripts/lib/vps-ssh.sh
source "$ROOT/scripts/lib/vps-ssh.sh"

LOCAL_PORT="${PROD_DB_LOCAL_PORT:-5433}"
REMOTE_PG_PORT="${PROD_DB_REMOTE_PORT:-5432}"

if [[ ! -f "$ROOT/.env.prod.local" ]]; then
  echo "Missing .env.prod.local — run: npm run db:prod:env" >&2
  exit 1
fi

if command -v ss >/dev/null && ss -ltn 2>/dev/null | grep -q ":${LOCAL_PORT} "; then
  echo "Port ${LOCAL_PORT} is already in use (maybe an old tunnel)." >&2
  echo "Stop it or pick another port: PROD_DB_LOCAL_PORT=5435 npm run db:prod:env && PROD_DB_LOCAL_PORT=5435 npm run db:prod:tunnel" >&2
  exit 1
fi

echo "Tunnel: 127.0.0.1:${LOCAL_PORT} -> ${VPS_HOST} -> 127.0.0.1:${REMOTE_PG_PORT}"
echo "Leave this terminal open. Ctrl+C to stop."
exec ssh "${SSH_OPTS[@]}" -N -L "127.0.0.1:${LOCAL_PORT}:127.0.0.1:${REMOTE_PG_PORT}" "$VPS_HOST"
