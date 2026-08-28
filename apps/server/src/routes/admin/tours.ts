import { Router } from 'express';
import { serializeQuestionChoices, parseQuestionChoices } from '@humiliation-game/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { requireAdmin } from '../../middleware/auth.js';

export const adminToursRouter = Router();

adminToursRouter.use(requireAdmin());

function normalizeChoices(value: unknown): Prisma.InputJsonValue {
  return serializeQuestionChoices(parseQuestionChoices(value)) as unknown as Prisma.InputJsonValue;
}

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
  const seriesId = typeof req.query.seriesId === 'string' ? req.query.seriesId : null;

  const tour = await prisma.tour.findUnique({
    where: { id: req.params.id },
    include: {
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

  if (seriesId) {
    const linked = tour.seriesTours.some((item) => item.seriesId === seriesId);
    if (!linked) {
      res.status(404).json({ error: 'Tour is not linked to this series' });
      return;
    }
  }

  const questions = await prisma.question.findMany({
    where: {
      tourId: tour.id,
      ...(seriesId ? { seriesId } : {}),
    },
    orderBy: { sortOrder: 'asc' },
  });

  res.json({ ...tour, questions });
});

adminToursRouter.post('/', async (req, res) => {
  const {
    title,
    rules,
    mediaUrls,
    defaultPoints,
    defaultTimeLimitSec,
    limitQuestionsToTeamCount,
    seriesId,
  } = req.body;

  if (seriesId) {
    const series = await prisma.series.findUnique({ where: { id: seriesId } });
    if (!series) {
      res.status(404).json({ error: 'Series not found' });
      return;
    }
  }

  const tour = await prisma.$transaction(async (tx) => {
    const created = await tx.tour.create({
      data: {
        title,
        rules,
        mediaUrls: mediaUrls ?? [],
        defaultPoints: defaultPoints ?? 3,
        defaultTimeLimitSec: defaultTimeLimitSec ?? 60,
        limitQuestionsToTeamCount: Boolean(limitQuestionsToTeamCount),
      },
    });

    if (seriesId) {
      const existingCount = await tx.seriesTour.count({ where: { seriesId } });
      await tx.seriesTour.create({
        data: {
          seriesId,
          tourId: created.id,
          sortOrder: existingCount,
        },
      });
    }

    return created;
  });

  res.status(201).json(tour);
});

adminToursRouter.put('/:id', async (req, res) => {
  const { title, rules, mediaUrls, defaultPoints, defaultTimeLimitSec, limitQuestionsToTeamCount } =
    req.body;
  const tour = await prisma.tour.update({
    where: { id: req.params.id },
    data: {
      title,
      rules,
      mediaUrls,
      defaultPoints,
      defaultTimeLimitSec,
      limitQuestionsToTeamCount: Boolean(limitQuestionsToTeamCount),
    },
  });
  res.json(tour);
});

adminToursRouter.delete('/:id', requireAdmin(['ADMIN']), async (req, res) => {
  await prisma.tour.delete({ where: { id: String(req.params.id) } });
  res.status(204).send();
});

adminToursRouter.post('/:tourId/questions', async (req, res) => {
  const data = req.body;
  const seriesId = typeof data.seriesId === 'string' ? data.seriesId : null;
  if (!seriesId) {
    res.status(400).json({ error: 'seriesId required' });
    return;
  }

  const linked = await prisma.seriesTour.findUnique({
    where: {
      seriesId_tourId: {
        seriesId,
        tourId: req.params.tourId,
      },
    },
  });
  if (!linked) {
    res.status(400).json({ error: 'Tour is not linked to this series' });
    return;
  }

  const maxSort = await prisma.question.aggregate({
    where: { tourId: req.params.tourId, seriesId },
    _max: { sortOrder: true },
  });

  const question = await prisma.question.create({
    data: {
      tourId: req.params.tourId,
      seriesId,
      sortOrder: data.sortOrder ?? (maxSort._max.sortOrder ?? -1) + 1,
      contentType: data.contentType ?? 'TEXT',
      prompt: data.prompt,
      mediaUrls: data.mediaUrls ?? [],
      answerType: data.answerType ?? 'TEXT',
      choices: normalizeChoices(data.choices),
      correctAnswer: data.correctAnswer,
      answerExplanation: data.answerExplanation ?? null,
      acceptableAnswers: data.acceptableAnswers ?? [],
      hints: data.hints ?? [],
      points: data.points,
      timeLimitSec: data.timeLimitSec,
      answerMedia: Array.isArray(data.answerMedia) ? data.answerMedia : [],
    },
  });
  res.status(201).json(question);
});

adminToursRouter.put('/:tourId/questions/order', async (req, res) => {
  const { questionIds } = req.body as { questionIds?: string[] };
  const seriesId = typeof req.query.seriesId === 'string'
    ? req.query.seriesId
    : typeof req.body?.seriesId === 'string'
      ? req.body.seriesId
      : null;

  if (!Array.isArray(questionIds)) {
    res.status(400).json({ error: 'questionIds array required' });
    return;
  }
  if (!seriesId) {
    res.status(400).json({ error: 'seriesId required' });
    return;
  }

  const questions = await prisma.question.findMany({
    where: { tourId: req.params.tourId, seriesId },
    select: { id: true },
  });

  const tourQuestionIds = new Set(questions.map((q) => q.id));
  if (
    questionIds.length !== questions.length
    || !questionIds.every((id) => tourQuestionIds.has(id))
  ) {
    res.status(400).json({ error: 'questionIds must list all series tour questions' });
    return;
  }

  await prisma.$transaction(
    questionIds.map((id, index) =>
      prisma.question.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );

  const tour = await prisma.tour.findUnique({
    where: { id: req.params.tourId },
    include: {
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

  const orderedQuestions = await prisma.question.findMany({
    where: { tourId: tour.id, seriesId },
    orderBy: { sortOrder: 'asc' },
  });

  res.json({ ...tour, questions: orderedQuestions });
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
      choices: normalizeChoices(data.choices),
      correctAnswer: data.correctAnswer,
      answerExplanation: data.answerExplanation ?? null,
      acceptableAnswers: data.acceptableAnswers,
      hints: data.hints ?? [],
      points: data.points,
      timeLimitSec: data.timeLimitSec,
      answerMedia: Array.isArray(data.answerMedia) ? data.answerMedia : [],
    },
  });
  res.json(question);
});

adminToursRouter.delete('/questions/:questionId', async (req, res) => {
  await prisma.question.delete({ where: { id: req.params.questionId } });
  res.status(204).send();
});
