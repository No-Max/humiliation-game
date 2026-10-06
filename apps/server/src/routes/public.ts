import { Router } from 'express';
import { parseQuestionChoices } from '@humiliation-game/shared';
import { prisma } from '../lib/prisma.js';
import { generateUniqueRoomCode } from '../lib/roomCode.js';
import { buildFinishedRoomState } from '../lib/gameResults.js';

export const publicRouter = Router();

publicRouter.get('/health', (_req, res) => {
  res.json({ ok: true });
});

publicRouter.get('/series', async (_req, res) => {
  const series = await prisma.series.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { number: 'desc' },
    include: {
      seriesTours: {
        orderBy: { sortOrder: 'asc' },
        include: {
          tour: {
            select: {
              id: true,
              title: true,
              defaultPoints: true,
              limitQuestionsToTeamCount: true,
            },
          },
        },
      },
    },
  });

  const counts = await prisma.question.groupBy({
    by: ['seriesId', 'tourId'],
    where: {
      seriesId: { in: series.map((item) => item.id) },
    },
    _count: { _all: true },
  });
  const countMap = new Map(
    counts.map((item) => [`${item.seriesId}:${item.tourId}`, item._count._all]),
  );

  res.json(
    series.map(({ seriesTours, ...item }) => ({
      ...item,
      tours: seriesTours.map(({ sortOrder, tour }) => ({
        ...tour,
        sortOrder,
        _count: {
          questions: countMap.get(`${item.id}:${tour.id}`) ?? 0,
        },
      })),
    })),
  );
});

publicRouter.get('/series/:id', async (req, res) => {
  const series = await prisma.series.findFirst({
    where: { id: req.params.id, status: 'PUBLISHED' },
    include: {
      seriesTours: {
        orderBy: { sortOrder: 'asc' },
        include: {
          tour: {
            select: {
              id: true,
              title: true,
              rules: true,
              defaultPoints: true,
              limitQuestionsToTeamCount: true,
            },
          },
        },
      },
    },
  });
  if (!series) {
    res.status(404).json({ error: 'Series not found' });
    return;
  }

  const counts = await prisma.question.groupBy({
    by: ['tourId'],
    where: { seriesId: series.id },
    _count: { _all: true },
  });
  const countMap = new Map(counts.map((item) => [item.tourId, item._count._all]));

  const sampleQuestions = await prisma.question.findMany({
    where: { seriesId: series.id },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      tourId: true,
      prompt: true,
      mediaUrls: true,
      audioUrl: true,
      answerType: true,
      choices: true,
    },
  });
  const sampleByTour = new Map<string, (typeof sampleQuestions)[number]>();
  for (const question of sampleQuestions) {
    if (!sampleByTour.has(question.tourId)) {
      sampleByTour.set(question.tourId, question);
    }
  }

  const { seriesTours, ...rest } = series;
  res.json({
    ...rest,
    tours: seriesTours.map(({ sortOrder, tour }) => {
      const sample = sampleByTour.get(tour.id);
      return {
        ...tour,
        sortOrder,
        _count: {
          questions: countMap.get(tour.id) ?? 0,
        },
        sampleQuestion: sample
          ? {
              id: sample.id,
              prompt: sample.prompt,
              mediaUrls: sample.mediaUrls,
              audioUrl: sample.audioUrl,
              answerType: sample.answerType,
              choices:
                sample.answerType === 'CHOICE' ? parseQuestionChoices(sample.choices) : [],
            }
          : null,
      };
    }),
  });
});

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

publicRouter.get('/sitemap.xml', async (_req, res) => {
  const siteUrl = (process.env.PUBLIC_SITE_URL ?? 'https://ingame.by').replace(/\/$/, '');
  const published = await prisma.series.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, updatedAt: true },
    orderBy: { number: 'desc' },
  });

  type SitemapUrl = {
    loc: string;
    changefreq: string;
    priority: string;
    lastmod?: string;
  };

  const urls: SitemapUrl[] = [
    { loc: `${siteUrl}/`, changefreq: 'weekly', priority: '1.0' },
    { loc: `${siteUrl}/series`, changefreq: 'weekly', priority: '0.9' },
    { loc: `${siteUrl}/rules`, changefreq: 'monthly', priority: '0.7' },
    { loc: `${siteUrl}/about`, changefreq: 'monthly', priority: '0.6' },
    ...published.map((item) => ({
      loc: `${siteUrl}/series/${item.id}`,
      lastmod: item.updatedAt.toISOString().slice(0, 10),
      changefreq: 'weekly',
      priority: '0.8',
    })),
  ];

  const urlEntries = urls
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>${entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ''}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
    )
    .join('\n');

  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`);
});

publicRouter.post('/rooms', async (req, res) => {
  const { seriesId, teamName, logoUrl } = req.body as {
    seriesId?: string;
    teamName?: string;
    logoUrl?: string;
  };

  if (!seriesId || !teamName) {
    res.status(400).json({ error: 'seriesId and teamName required' });
    return;
  }

  const series = await prisma.series.findFirst({
    where: { id: seriesId, status: 'PUBLISHED' },
  });
  if (!series) {
    res.status(404).json({ error: 'Series not found' });
    return;
  }

  const code = await generateUniqueRoomCode();

  const room = await prisma.$transaction(async (tx) => {
    const createdRoom = await tx.gameRoom.create({
      data: { code, seriesId },
    });

    const hostTeam = await tx.gameTeam.create({
      data: {
        roomId: createdRoom.id,
        name: teamName,
        logoUrl,
        sortOrder: 0,
      },
    });

    return tx.gameRoom.update({
      where: { id: createdRoom.id },
      data: { hostTeamId: hostTeam.id },
      include: {
        teams: true,
        series: { select: { id: true, title: true } },
      },
    });
  });

  const hostTeam = room.teams[0];

  res.status(201).json({
    roomCode: room.code,
    teamId: hostTeam.id,
    seriesTitle: room.series.title,
    joinUrl: `/join/${room.code}`,
    displayUrl: `/display/${room.code}`,
    teamSlotUrl: `/team/${room.code}/${hostTeam.id}`,
  });
});

publicRouter.get('/rooms/:code', async (req, res) => {
  const room = await prisma.gameRoom.findUnique({
    where: { code: req.params.code },
    include: {
      series: { select: { id: true, title: true } },
      teams: { orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json({
    ...room,
    displayUrl: `/display/${room.code}`,
    teamSlots: room.teams.map((t) => ({
      teamId: t.id,
      name: t.name,
      slotUrl: `/team/${room.code}/${t.id}`,
    })),
  });
});

publicRouter.get('/rooms/:code/results', async (req, res) => {
  const room = await prisma.gameRoom.findUnique({
    where: { code: req.params.code },
    include: {
      series: { select: { id: true, title: true } },
      teams: { orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  if (room.status !== 'FINISHED') {
    res.status(404).json({ error: 'Game not finished' });
    return;
  }
  res.json(buildFinishedRoomState(room));
});
