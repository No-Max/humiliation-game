#!/usr/bin/env bash
# Rsync media files from VPS into apps/server/uploads (for local dev after prod DB restore).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=scripts/lib/vps-ssh.sh
source "$ROOT/scripts/lib/vps-ssh.sh"

REMOTE_ENV="/opt/humiliation-game/apps/server/.env"
LOCAL_DIR="$ROOT/apps/server/uploads"

remote_upload_dir="$("${SSH[@]}" "$VPS_HOST" "set -a && source '$REMOTE_ENV' && set +a && echo \"\${UPLOAD_DIR:-/var/lib/humiliation-game/uploads}\"")"
remote_upload_dir="${remote_upload_dir//$'\r'/}"

mkdir -p "$LOCAL_DIR"

echo "==> Sync uploads from $VPS_HOST:$remote_upload_dir"
RSYNC=(rsync -avz --delete
  --exclude .gitkeep
  -e "ssh ${SSH_OPTS[*]}")
"${RSYNC[@]}" "$VPS_HOST:$remote_upload_dir/" "$LOCAL_DIR/"

echo "==> Done: $LOCAL_DIR"
