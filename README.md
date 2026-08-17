# Humiliation Game

Викторина для команд: Vue 3 + Node.js + PostgreSQL.

## Структура

```
apps/
  web/      — приложение для игроков (порт 3210)
  admin/    — админка контента (порт 3220)
  server/   — API + WebSocket (порт 3200)
packages/
  shared/   — общие TypeScript-типы
```

## Быстрый старт

```bash
# 1. Зависимости
npm install

# 2. PostgreSQL
npm run db:up

# 3. Переменные окружения
cp .env.example apps/server/.env

# 4. Миграции и seed
npm run db:migrate
npm run db:seed

# 5. Запуск (в отдельных терминалах)
npm run dev:server   # http://localhost:3200
npm run dev:web      # http://localhost:3210
npm run dev:admin    # http://localhost:3220

# Публичный доступ (Cloudflare Tunnel)
npm run dev:public   # API + web + https://….trycloudflare.com
```

Нужен `cloudflared` (`brew install cloudflared`).

## Учётки (seed)

| Роль | Email | Пароль |
|------|-------|--------|
| Admin | admin@game.local | admin123 |
| Editor | editor@game.local | editor123 |

## API

- `GET /api/health` — проверка сервера
- `GET /api/series` — опубликованные выпуски
- `POST /api/rooms` — создать комнату
- `POST /api/admin/auth/login` — вход в админку
- `CRUD /api/admin/series` — управление контентом

## WebSocket

Подключение через Socket.io. События: `joinRoom`, `startTour`, `submitAnswer`, `pass`, `roomState`.

## Игровой флоу

1. Создать комнату → поделиться ссылкой с соперником и экраном
2. `/join/:code` — подключение команды (джойстик)
3. `/display/:code` — экран для TV (read-only)
4. `/play/:code` — управление игрой с телефона

## VPS (Hoster.by): SSH

Ключ для панели Hoster.by — **RSA 4096** (ed25519 часто не принимается):

```bash
ssh-keygen -t rsa -b 4096 -C "hosterby-vps" -f ~/.ssh/id_rsa_hosterby
cat ~/.ssh/id_rsa_hosterby.pub   # вставить в панель Hoster.by
```

Подключение:

```bash
ssh -i ~/.ssh/id_rsa_hosterby -o IdentitiesOnly=yes root@IP_СЕРВЕРА
```

Если ключ добавляли через веб-консоль (вставка в nano часто не работает), проще так:

```bash
# на ПК — получить ссылку на ключ
curl --upload-file ~/.ssh/id_rsa_hosterby.pub https://transfer.sh/hosterby.pub

# на сервере
mkdir -p ~/.ssh && chmod 700 ~/.ssh
curl -fsSL "ССЫЛКА" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Если ошибка `REMOTE HOST IDENTIFICATION HAS CHANGED` (после переустановки VPS):

```bash
ssh-keygen -f ~/.ssh/known_hosts -R IP_СЕРВЕРА
```

## VPS: деплой

Минимум на VPS: Ubuntu 24/26, ~1 GB RAM (скрипт добавит swap 1 GB).

**1. Один раз на сервере** (после SSH):

```bash
mkdir -p /opt/humiliation-game
# скопировать deploy/ на сервер или клонировать репозиторий
bash /opt/humiliation-game/deploy/bootstrap-server.sh
```

**2. С локальной машины** (сборка + upload + миграции + pm2):

```bash
chmod +x deploy/deploy-from-local.sh
VPS_HOST=root@178.172.236.236 ./deploy/deploy-from-local.sh
```

Первый деплой с seed-данными:

```bash
SEED=1 VPS_HOST=root@178.172.236.236 ./deploy/deploy-from-local.sh
```

**Адреса (по IP, до настройки DNS):**

- Игра: `http://178.172.236.236/`
- Админка: `http://178.172.236.236:8080/` или `http://admin.ingame.by/` (после DNS)

**DNS (панель Hoster.by):** A-записи `ingame.by`, `www`, `admin` → `178.172.236.236`.

После привязки домена обновите `CORS_ORIGIN` в `/opt/humiliation-game/apps/server/.env` и nginx.
