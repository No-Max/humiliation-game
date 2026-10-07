import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { requireAdmin } from '../../middleware/auth.js';

export const adminCommentsRouter = Router();

adminCommentsRouter.use(requireAdmin());

adminCommentsRouter.get('/', async (_req, res) => {
  const comments = await prisma.seriesComment.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      series: { select: { id: true, number: true, title: true } },
    },
  });

  res.json(
    comments.map((c) => ({
      id: c.id,
      message: c.message,
      telegramName: c.telegramName,
      teamName: c.teamName,
      hidden: c.hidden,
      createdAt: c.createdAt.toISOString(),
      series: c.series,
    })),
  );
});

adminCommentsRouter.patch('/:id', async (req, res) => {
  const existing = await prisma.seriesComment.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Комментарий не найден' });
    return;
  }

  const body = req.body as { hidden?: boolean };
  if (typeof body.hidden !== 'boolean') {
    res.status(400).json({ error: 'Укажите hidden: true или false' });
    return;
  }

  const comment = await prisma.seriesComment.update({
    where: { id: existing.id },
    data: { hidden: body.hidden },
    include: {
      series: { select: { id: true, number: true, title: true } },
    },
  });

  res.json({
    id: comment.id,
    message: comment.message,
    telegramName: comment.telegramName,
    teamName: comment.teamName,
    hidden: comment.hidden,
    createdAt: comment.createdAt.toISOString(),
    series: comment.series,
  });
});

adminCommentsRouter.delete('/:id', requireAdmin(['ADMIN']), async (req, res) => {
  await prisma.seriesComment.delete({ where: { id: String(req.params.id) } });
  res.status(204).send();
});
