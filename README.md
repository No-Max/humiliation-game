# Humiliation Game

Викторина для команд: Vue 3 + Node.js + PostgreSQL.

## Структура

```
apps/
  web/      — приложение для игроков (порт 5173)
  admin/    — админка контента (порт 5174)
  server/   — API + WebSocket (порт 3000)
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
npm run dev:server   # http://localhost:3000
npm run dev:web      # http://localhost:5173
npm run dev:admin    # http://localhost:5174
```

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
