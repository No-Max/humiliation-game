#!/usr/bin/env bash
# Однократная подготовка VPS (Ubuntu). Запуск на сервере от root:
#   bash bootstrap-server.sh
set -euo pipefail

APP_DIR=/opt/humiliation-game
UPLOAD_DIR=/var/lib/humiliation-game/uploads
ENV_FILE="$APP_DIR/apps/server/.env"

echo "==> Swap (1 GB)"
if [ ! -f /swapfile ]; then
  fallocate -l 1G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=1024
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Пакеты"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git nginx postgresql postgresql-contrib ufw rsync

if ! command -v node >/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi

if ! command -v pm2 >/dev/null; then
  npm install -g pm2
fi

echo "==> Firewall"
ufw allow 22 >/dev/null
ufw allow 80 >/dev/null
ufw allow 443 >/dev/null
ufw allow 8080 >/dev/null
ufw --force enable >/dev/null

echo "==> PostgreSQL"
mkdir -p "$APP_DIR" "$UPLOAD_DIR" "$(dirname "$ENV_FILE")"
DBPASS=$(openssl rand -hex 16)
JWT=$(openssl rand -hex 32)

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = 'game'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER game WITH PASSWORD '$DBPASS';"
sudo -u postgres psql -c "ALTER USER game WITH PASSWORD '$DBPASS';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'humiliation_game'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE humiliation_game OWNER game;"

SERVER_IP=$(curl -fsS ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
cat > "$ENV_FILE" <<EOF
DATABASE_URL="postgresql://game:${DBPASS}@localhost:5432/humiliation_game"
PORT=3200
JWT_SECRET=${JWT}
CORS_ORIGIN=http://${SERVER_IP},http://${SERVER_IP}:8080
UPLOAD_DIR=${UPLOAD_DIR}
MAX_UPLOAD_SIZE=10485760
MAX_ANSWER_MEDIA_UPLOAD_SIZE=5242880
EOF
chmod 600 "$ENV_FILE"

echo "==> nginx"
install -m 644 "$(dirname "$0")/nginx-humiliation.conf" /etc/nginx/sites-available/humiliation-game
ln -sf /etc/nginx/sites-available/humiliation-game /etc/nginx/sites-enabled/humiliation-game
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "==> Готово"
echo "Node $(node -v), npm $(npm -v)"
echo "Env: $ENV_FILE"
echo "Дальше с локальной машины: ./deploy/deploy-from-local.sh"
