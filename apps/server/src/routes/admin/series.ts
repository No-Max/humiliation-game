import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { requireAdmin } from '../../middleware/auth.js';

export const adminSeriesRouter = Router();

adminSeriesRouter.use(requireAdmin());

adminSeriesRouter.get('/', async (_req, res) => {
  const series = await prisma.series.findMany({
    orderBy: { number: 'desc' },
    include: {
      _count: { select: { tours: true } },
    },
  });
  res.json(series);
});

adminSeriesRouter.get('/:id', async (req, res) => {
  const series = await prisma.series.findUnique({
    where: { id: req.params.id },
    include: {
      tours: {
        orderBy: { sortOrder: 'asc' },
        include: {
          questions: { orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  });
  if (!series) {
    res.status(404).json({ error: 'Series not found' });
    return;
  }
  res.json(series);
});

adminSeriesRouter.post('/', async (req, res) => {
  const { title, number, description, coverUrl, status } = req.body;
  const series = await prisma.series.create({
    data: {
      title,
      number,
      description,
      coverUrl,
      status: status ?? 'DRAFT',
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
    },
  });
  res.status(201).json(series);
});

adminSeriesRouter.put('/:id', async (req, res) => {
  const { title, number, description, coverUrl, status } = req.body;
  const series = await prisma.series.update({
    where: { id: req.params.id },
    data: {
      title,
      number,
      description,
      coverUrl,
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : undefined,
    },
  });
  res.json(series);
});

adminSeriesRouter.delete('/:id', requireAdmin(['ADMIN']), async (req, res) => {
  await prisma.series.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// Tours
adminSeriesRouter.post('/:seriesId/tours', async (req, res) => {
  const { title, rules, defaultPoints, defaultTimeLimitSec, sortOrder } = req.body;
  const tour = await prisma.tour.create({
    data: {
      seriesId: req.params.seriesId,
      title,
      rules,
      defaultPoints: defaultPoints ?? 3,
      defaultTimeLimitSec: defaultTimeLimitSec ?? 60,
      sortOrder: sortOrder ?? 0,
    },
  });
  res.status(201).json(tour);
});

adminSeriesRouter.put('/tours/:tourId', async (req, res) => {
  const { title, rules, defaultPoints, defaultTimeLimitSec, sortOrder } = req.body;
  const tour = await prisma.tour.update({
    where: { id: req.params.tourId },
    data: { title, rules, defaultPoints, defaultTimeLimitSec, sortOrder },
  });
  res.json(tour);
});

adminSeriesRouter.delete('/tours/:tourId', async (req, res) => {
  await prisma.tour.delete({ where: { id: req.params.tourId } });
  res.status(204).send();
});

// Questions
adminSeriesRouter.post('/tours/:tourId/questions', async (req, res) => {
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
      timeLimitSec: data.timeLimitSec,
    },
  });
  res.status(201).json(question);
});

adminSeriesRouter.put('/questions/:questionId', async (req, res) => {
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
      timeLimitSec: data.timeLimitSec,
    },
  });
  res.json(question);
});

adminSeriesRouter.delete('/questions/:questionId', async (req, res) => {
  await prisma.question.delete({ where: { id: req.params.questionId } });
  res.status(204).send();
});
