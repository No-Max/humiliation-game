import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { normalizeReviewMessage, plainTextFromReviewHtml } from '../../lib/reviews.js';
import { requireAdmin } from '../../middleware/auth.js';

export const adminReviewsRouter = Router();

adminReviewsRouter.use(requireAdmin());

function serializeReview(review: {
  id: string;
  playerId: string;
  message: string;
  telegramName: string;
  teamName: string | null;
  teamLogoUrl: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...review,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}

adminReviewsRouter.get('/', async (_req, res) => {
  const reviews = await prisma.playerReview.findMany({
    orderBy: [{ published: 'desc' }, { createdAt: 'desc' }],
  });
  res.json(reviews.map(serializeReview));
});

adminReviewsRouter.get('/:id', async (req, res) => {
  const review = await prisma.playerReview.findUnique({ where: { id: req.params.id } });
  if (!review) {
    res.status(404).json({ error: 'Отзыв не найден' });
    return;
  }
  res.json(serializeReview(review));
});

adminReviewsRouter.put('/:id', async (req, res) => {
  const existing = await prisma.playerReview.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Отзыв не найден' });
    return;
  }

  const body = req.body as {
    message?: string;
    published?: boolean;
    telegramName?: string;
    teamName?: string | null;
    teamLogoUrl?: string | null;
  };

  let message = existing.message;
  if (body.message !== undefined) {
    const normalized = normalizeReviewMessage(body.message);
    if (!normalized || !plainTextFromReviewHtml(normalized)) {
      res.status(400).json({ error: 'Введите текст отзыва' });
      return;
    }
    message = normalized;
  }

  const telegramName =
    typeof body.telegramName === 'string' && body.telegramName.trim()
      ? body.telegramName.trim().slice(0, 120)
      : existing.telegramName;

  const teamName =
    body.teamName === null
      ? null
      : typeof body.teamName === 'string'
        ? body.teamName.trim().slice(0, 40) || null
        : existing.teamName;

  const teamLogoUrl =
    body.teamLogoUrl === null
      ? null
      : typeof body.teamLogoUrl === 'string'
        ? body.teamLogoUrl.trim() || null
        : existing.teamLogoUrl;

  const published = typeof body.published === 'boolean' ? body.published : existing.published;

  const review = await prisma.playerReview.update({
    where: { id: existing.id },
    data: {
      message,
      telegramName,
      teamName,
      teamLogoUrl,
      published,
    },
  });

  res.json(serializeReview(review));
});

adminReviewsRouter.delete('/:id', requireAdmin(['ADMIN']), async (req, res) => {
  await prisma.playerReview.delete({ where: { id: String(req.params.id) } });
  res.status(204).send();
});
