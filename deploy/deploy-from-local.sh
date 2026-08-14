#!/usr/bin/env bash
# Деплой с локальной машины:
#   VPS_HOST=root@87.232.65.69 ./deploy/deploy-from-local.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${VPS_HOST:-root@87.232.65.69}"
SSH_KEY="${VPS_SSH_KEY:-$HOME/.ssh/id_rsa_hosterby}"
KNOWN_HOSTS="${VPS_KNOWN_HOSTS:-$HOME/.ssh/known_hosts_hosterby}"
SSH_OPTS=(-i "$SSH_KEY" -o IdentitiesOnly=yes -o "UserKnownHostsFile=$KNOWN_HOSTS" -o StrictHostKeyChecking=accept-new)
SSH=(ssh "${SSH_OPTS[@]}")
RSYNC=(rsync -avz --delete
  --exclude node_modules
  --exclude .git
  --exclude apps/server/uploads
  -e "ssh ${SSH_OPTS[*]}")

echo "==> Build"
cd "$ROOT"
npm run build

echo "==> Upload"
"${RSYNC[@]}" "$ROOT/" "$HOST:/opt/humiliation-game/"

echo "==> Install & migrate & restart"
"${SSH[@]}" "$HOST" 'set -euo pipefail
apt-get clean 2>/dev/null || true
rm -rf /root/.npm/_cacache
cd /opt/humiliation-game
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm ci
cd apps/server
npx prisma generate
npx prisma migrate deploy
if [ "${SEED:-0}" = "1" ]; then npm run db:seed; fi
cd /opt/humiliation-game/apps/server
if pm2 describe humiliation-api >/dev/null 2>&1; then
  pm2 restart humiliation-api
else
  pm2 start dist/index.js --name humiliation-api
  pm2 save
  pm2 startup systemd -u root --hp /root >/dev/null || true
fi
systemctl reload nginx
'

echo "==> Done"
echo "Web:   http://$(echo "$HOST" | cut -d@ -f2)/"
echo "Admin: http://$(echo "$HOST" | cut -d@ -f2):8080/"
