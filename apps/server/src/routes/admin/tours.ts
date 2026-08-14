import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { requireAdmin } from '../../middleware/auth.js';

export const adminToursRouter = Router();

adminToursRouter.use(requireAdmin());

adminToursRouter.get('/', async (_req, res) => {
  const tours = await prisma.tour.findMany({
    orderBy: { title: 'asc' },
    include: {
      _count: { select: { seriesTours: true } },
    },
  });
  res.json(tours);
});

adminToursRouter.get('/:id', async (req, res) => {
  const tour = await prisma.tour.findUnique({
    where: { id: req.params.id },
    include: {
      questions: { orderBy: { sortOrder: 'asc' } },
      seriesTours: {
        orderBy: { sortOrder: 'asc' },
        include: { series: { select: { id: true, title: true, number: true } } },
      },
    },
  });
  if (!tour) {
    res.status(404).json({ error: 'Tour not found' });
    return;
  }
  res.json(tour);
});

adminToursRouter.post('/', async (req, res) => {
  const { title, rules, defaultPoints, defaultTimeLimitSec } = req.body;
  const tour = await prisma.tour.create({
    data: {
      title,
      rules,
      defaultPoints: defaultPoints ?? 3,
      defaultTimeLimitSec: defaultTimeLimitSec ?? 60,
    },
  });
  res.status(201).json(tour);
});

adminToursRouter.put('/:id', async (req, res) => {
  const { title, rules, defaultPoints, defaultTimeLimitSec } = req.body;
  const tour = await prisma.tour.update({
    where: { id: req.params.id },
    data: { title, rules, defaultPoints, defaultTimeLimitSec },
  });
  res.json(tour);
});

adminToursRouter.delete('/:id', requireAdmin(['ADMIN']), async (req, res) => {
  await prisma.tour.delete({ where: { id: String(req.params.id) } });
  res.status(204).send();
});

adminToursRouter.post('/:tourId/questions', async (req, res) => {
  const data = req.body;
  const question = await prisma.question.create({
    data: {
      tourId: req.params.tourId,
      sortOrder: data.sortOrder ?? 0,
      contentType: data.contentType ?? 'TEXT',
      prompt: data.prompt,
      mediaUrls: data.mediaUrls ?? [],
      answerType: data.answerType ?? 'TEXT',
      choices: data.choices ?? [],
      correctAnswer: data.correctAnswer,
      acceptableAnswers: data.acceptableAnswers ?? [],
      hints: data.hints ?? [],
      points: data.points,
      timeLimitSec: data.timeLimitSec,
    },
  });
  res.status(201).json(question);
});

adminToursRouter.put('/questions/:questionId', async (req, res) => {
  const data = req.body;
  const question = await prisma.question.update({
    where: { id: req.params.questionId },
    data: {
      sortOrder: data.sortOrder,
      contentType: data.contentType,
      prompt: data.prompt,
      mediaUrls: data.mediaUrls,
      answerType: data.answerType,
      choices: data.choices,
      correctAnswer: data.correctAnswer,
      acceptableAnswers: data.acceptableAnswers,
      hints: data.hints ?? [],
      points: data.points,
      timeLimitSec: data.timeLimitSec,
    },
  });
  res.json(question);
});

adminToursRouter.delete('/questions/:questionId', async (req, res) => {
  await prisma.question.delete({ where: { id: req.params.questionId } });
  res.status(204).send();
});
