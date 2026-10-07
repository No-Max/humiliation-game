import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { MAX_TEAM_NAME_LENGTH } from '@humiliation-game/shared';
import { prisma } from '../lib/prisma.js';
import { resolveUploadDir } from '../lib/paths.js';
import {
  clearSessionCookie,
  getSessionPlayerId,
  setSessionCookie,
} from '../lib/playerSession.js';
import { type TelegramLoginData, verifyTelegramLogin } from '../lib/telegramAuth.js';
import {
  COMMENT_COOLDOWN_MS,
  commentCooldownRemainingMs,
  normalizeCommentMessage,
} from '../lib/comments.js';
import {
  REVIEWS_PER_MONTH_LIMIT,
  normalizeReviewMessage,
  plainTextFromReviewHtml,
  reviewsRemainingThisMonth,
  startOfCurrentMonthMinsk,
  telegramAuthorLabel,
} from '../lib/reviews.js';

export const authRouter = Router();

const uploadDir = resolveUploadDir();
fs.mkdirSync(uploadDir, { recursive: true });

const logoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `team-${unique}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Можно загружать только изображения'));
  },
});

function publicPlayer(player: {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  teamName: string | null;
  teamLogoUrl: string | null;
}) {
  return {
    id: player.id,
    telegramId: player.telegramId,
    username: player.username,
    firstName: player.firstName,
    lastName: player.lastName,
    photoUrl: player.photoUrl,
    teamName: player.teamName,
    teamLogoUrl: player.teamLogoUrl,
  };
}

authRouter.get('/config', (_req, res) => {
  res.json({
    telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME?.trim() || null,
  });
});

authRouter.get('/me', async (req, res) => {
  const playerId = getSessionPlayerId(req);
  if (!playerId) {
    res.json({ user: null });
    return;
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    clearSessionCookie(res);
    res.json({ user: null });
    return;
  }

  res.json({ user: publicPlayer(player) });
});

authRouter.post('/telegram', async (req, res) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) {
    res.status(503).json({ error: 'Авторизация через Telegram не настроена' });
    return;
  }

  const data = req.body as TelegramLoginData;
  if (!verifyTelegramLogin(data, botToken)) {
    res.status(401).json({ error: 'Неверный ответ Telegram' });
    return;
  }

  const telegramId = String(data.id);
  const player = await prisma.player.upsert({
    where: { telegramId },
    create: {
      telegramId,
      username: data.username ?? null,
      firstName: data.first_name ?? null,
      lastName: data.last_name ?? null,
      photoUrl: data.photo_url ?? null,
    },
    update: {
      username: data.username ?? null,
      firstName: data.first_name ?? null,
      lastName: data.last_name ?? null,
      photoUrl: data.photo_url ?? null,
    },
  });

  setSessionCookie(res, player.id);
  res.json({ user: publicPlayer(player) });
});

authRouter.post('/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

authRouter.patch('/profile', async (req, res) => {
  const playerId = getSessionPlayerId(req);
  if (!playerId) {
    res.status(401).json({ error: 'Нужно войти' });
    return;
  }

  const body = req.body as { teamName?: string };
  const teamName =
    typeof body.teamName === 'string'
      ? body.teamName.trim().slice(0, MAX_TEAM_NAME_LENGTH)
      : undefined;

  const player = await prisma.player.update({
    where: { id: playerId },
    data: {
      ...(teamName !== undefined ? { teamName: teamName || null } : {}),
    },
  });

  res.json({ user: publicPlayer(player) });
});

authRouter.post('/profile/logo', (req, res) => {
  logoUpload.single('file')(req, res, async (err) => {
    if (err) {
      const message =
        err && typeof err === 'object' && 'code' in err && err.code === 'LIMIT_FILE_SIZE'
          ? 'Файл слишком большой. Максимум 2 МБ'
          : err instanceof Error
            ? err.message
            : 'Ошибка загрузки';
      res.status(400).json({ error: message });
      return;
    }

    const playerId = getSessionPlayerId(req);
    if (!playerId) {
      res.status(401).json({ error: 'Нужно войти' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'Файл не загружен' });
      return;
    }

    const teamLogoUrl = `/uploads/${req.file.filename}`;
    const player = await prisma.player.update({
      where: { id: playerId },
      data: { teamLogoUrl },
    });

    res.json({ user: publicPlayer(player) });
  });
});

authRouter.post('/claim-game', async (req, res) => {
  const playerId = getSessionPlayerId(req);
  if (!playerId) {
    res.status(401).json({ error: 'Нужно войти' });
    return;
  }

  const { roomCode, teamId } = req.body as { roomCode?: string; teamId?: string };
  if (!roomCode || !teamId) {
    res.status(400).json({ error: 'roomCode и teamId обязательны' });
    return;
  }

  const room = await prisma.gameRoom.findUnique({
    where: { code: roomCode },
    include: { teams: true },
  });
  if (!room) {
    res.status(404).json({ error: 'Комната не найдена' });
    return;
  }

  const team = room.teams.find((t) => t.id === teamId);
  if (!team) {
    res.status(404).json({ error: 'Команда не найдена' });
    return;
  }

  if (team.playerId && team.playerId !== playerId) {
    res.status(409).json({ error: 'Эта команда уже привязана к другому игроку' });
    return;
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    clearSessionCookie(res);
    res.status(401).json({ error: 'Нужно войти' });
    return;
  }

  await prisma.gameTeam.update({
    where: { id: teamId },
    data: {
      playerId,
      ...(player.teamLogoUrl && !team.logoUrl ? { logoUrl: player.teamLogoUrl } : {}),
    },
  });

  res.json({ ok: true, saved: true });
});

authRouter.get('/games', async (req, res) => {
  const playerId = getSessionPlayerId(req);
  if (!playerId) {
    res.status(401).json({ error: 'Нужно войти' });
    return;
  }

  const teams = await prisma.gameTeam.findMany({
    where: {
      playerId,
      room: { status: 'FINISHED' },
    },
    include: {
      room: {
        include: {
          series: { select: { id: true, title: true, number: true } },
          teams: { orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, score: true } },
        },
      },
    },
    orderBy: { room: { updatedAt: 'desc' } },
  });

  res.json({
    games: teams.map((team) => ({
      roomCode: team.room.code,
      seriesId: team.room.series.id,
      seriesTitle: team.room.series.title,
      seriesNumber: team.room.series.number,
      finishedAt: team.room.updatedAt.toISOString(),
      myTeamId: team.id,
      myTeamName: team.name,
      myScore: team.score,
      teams: team.room.teams,
    })),
  });
});

authRouter.get('/reviews/mine', async (req, res) => {
  const playerId = getSessionPlayerId(req);
  if (!playerId) {
    res.status(401).json({ error: 'Нужно войти' });
    return;
  }

  const monthStart = startOfCurrentMonthMinsk();
  const [draft, createdThisMonth] = await Promise.all([
    prisma.playerReview.findFirst({
      where: { playerId, published: false },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.playerReview.count({
      where: { playerId, createdAt: { gte: monthStart } },
    }),
  ]);

  const remainingThisMonth = reviewsRemainingThisMonth(createdThisMonth);

  res.json({
    review: draft
      ? {
          id: draft.id,
          message: draft.message,
          published: draft.published,
          createdAt: draft.createdAt.toISOString(),
          updatedAt: draft.updatedAt.toISOString(),
        }
      : null,
    monthlyLimit: REVIEWS_PER_MONTH_LIMIT,
    createdThisMonth,
    remainingThisMonth,
    canCreateNew: !draft && remainingThisMonth > 0,
  });
});

authRouter.post('/reviews', async (req, res) => {
  const playerId = getSessionPlayerId(req);
  if (!playerId) {
    res.status(401).json({ error: 'Нужно войти' });
    return;
  }

  const message = normalizeReviewMessage((req.body as { message?: string }).message);
  if (!message || !plainTextFromReviewHtml(message)) {
    res.status(400).json({ error: 'Введите текст отзыва' });
    return;
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    clearSessionCookie(res);
    res.status(401).json({ error: 'Нужно войти' });
    return;
  }

  const draft = await prisma.playerReview.findFirst({
    where: { playerId, published: false },
    orderBy: { createdAt: 'desc' },
  });

  const snapshot = {
    message,
    telegramName: telegramAuthorLabel(player),
    teamName: player.teamName,
    teamLogoUrl: player.teamLogoUrl,
    published: false,
  };

  if (draft) {
    const review = await prisma.playerReview.update({
      where: { id: draft.id },
      data: snapshot,
    });
    res.json({
      review: {
        id: review.id,
        message: review.message,
        published: review.published,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
      },
    });
    return;
  }

  const createdThisMonth = await prisma.playerReview.count({
    where: { playerId, createdAt: { gte: startOfCurrentMonthMinsk() } },
  });
  if (createdThisMonth >= REVIEWS_PER_MONTH_LIMIT) {
    res.status(429).json({
      error: `Не больше ${REVIEWS_PER_MONTH_LIMIT} отзывов в месяц`,
    });
    return;
  }

  const review = await prisma.playerReview.create({
    data: { playerId, ...snapshot },
  });

  res.status(201).json({
    review: {
      id: review.id,
      message: review.message,
      published: review.published,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
    },
  });
});

authRouter.post('/series/:seriesId/comments', async (req, res) => {
  const playerId = getSessionPlayerId(req);
  if (!playerId) {
    res.status(401).json({ error: 'Нужно войти' });
    return;
  }

  const seriesId = String(req.params.seriesId);
  const message = normalizeCommentMessage((req.body as { message?: string }).message);
  if (!message) {
    res.status(400).json({ error: 'Введите текст комментария' });
    return;
  }

  const series = await prisma.series.findFirst({
    where: { id: seriesId, status: 'PUBLISHED' },
    select: { id: true },
  });
  if (!series) {
    res.status(404).json({ error: 'Выпуск не найден' });
    return;
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    clearSessionCookie(res);
    res.status(401).json({ error: 'Нужно войти' });
    return;
  }

  const last = await prisma.seriesComment.findFirst({
    where: { playerId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  const remainingMs = commentCooldownRemainingMs(last?.createdAt);
  if (remainingMs > 0) {
    res.status(429).json({
      error: 'Подождите перед следующим комментарием',
      retryAfterSeconds: Math.ceil(remainingMs / 1000),
      cooldownMs: COMMENT_COOLDOWN_MS,
    });
    return;
  }

  const comment = await prisma.seriesComment.create({
    data: {
      seriesId,
      playerId,
      message,
      telegramName: telegramAuthorLabel(player),
      teamName: player.teamName,
      teamLogoUrl: player.teamLogoUrl,
    },
  });

  res.status(201).json({
    comment: {
      id: comment.id,
      message: comment.message,
      telegramName: comment.telegramName,
      teamName: comment.teamName,
      teamLogoUrl: comment.teamLogoUrl,
      createdAt: comment.createdAt.toISOString(),
    },
  });
});
