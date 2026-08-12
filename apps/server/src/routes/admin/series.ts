import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { loadSeriesWithTours } from '../../lib/seriesContent.js';
import { requireAdmin } from '../../middleware/auth.js';

export const adminSeriesRouter = Router();

adminSeriesRouter.use(requireAdmin());

adminSeriesRouter.get('/', async (_req, res) => {
  const series = await prisma.series.findMany({
    orderBy: { number: 'desc' },
    include: {
      _count: { select: { seriesTours: true } },
    },
  });
  res.json(
    series.map(({ _count, ...item }) => ({
      ...item,
      _count: { tours: _count.seriesTours },
    })),
  );
});

adminSeriesRouter.get('/:id', async (req, res) => {
  const series = await loadSeriesWithTours({ id: req.params.id });
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
      ...(status !== undefined && {
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      }),
    },
  });
  res.json(series);
});

adminSeriesRouter.delete('/:id', requireAdmin(['ADMIN']), async (req, res) => {
  await prisma.series.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

adminSeriesRouter.post('/:seriesId/tours', async (req, res) => {
  const { tourId } = req.body as { tourId?: string };
  if (!tourId) {
    res.status(400).json({ error: 'tourId required' });
    return;
  }

  const tour = await prisma.tour.findUnique({ where: { id: tourId } });
  if (!tour) {
    res.status(404).json({ error: 'Tour not found' });
    return;
  }

  const existingCount = await prisma.seriesTour.count({
    where: { seriesId: req.params.seriesId },
  });

  try {
    await prisma.seriesTour.create({
      data: {
        seriesId: req.params.seriesId,
        tourId,
        sortOrder: existingCount,
      },
    });
  } catch {
    res.status(409).json({ error: 'Tour already added to this series' });
    return;
  }

  const series = await loadSeriesWithTours({ id: req.params.seriesId });
  res.status(201).json(series);
});

adminSeriesRouter.delete('/:seriesId/tours/:tourId', async (req, res) => {
  await prisma.seriesTour.delete({
    where: {
      seriesId_tourId: {
        seriesId: req.params.seriesId,
        tourId: req.params.tourId,
      },
    },
  });
  res.status(204).send();
});

adminSeriesRouter.put('/:seriesId/tours/order', async (req, res) => {
  const { tourIds } = req.body as { tourIds?: string[] };
  if (!Array.isArray(tourIds)) {
    res.status(400).json({ error: 'tourIds array required' });
    return;
  }

  await prisma.$transaction(
    tourIds.map((tourId, index) =>
      prisma.seriesTour.update({
        where: {
          seriesId_tourId: {
            seriesId: req.params.seriesId,
            tourId,
          },
        },
        data: { sortOrder: index },
      }),
    ),
  );

  const series = await loadSeriesWithTours({ id: req.params.seriesId });
  res.json(series);
});
