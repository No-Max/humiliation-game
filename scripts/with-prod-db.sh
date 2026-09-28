#!/usr/bin/env bash
# Run a command with DATABASE_URL from .env.prod.local (prod DB via SSH tunnel).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.prod.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — run: npm run db:prod:env" >&2
  exit 1
fi

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <command...>" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

cd "$ROOT/apps/server"
exec "$@"
