import { Router } from 'express';
import { nanoid } from 'nanoid';
import { prisma } from '../lib/prisma.js';

export const publicRouter = Router();

publicRouter.get('/health', (_req, res) => {
  res.json({ ok: true });
});

publicRouter.get('/series', async (_req, res) => {
  const series = await prisma.series.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { number: 'desc' },
    include: {
      tours: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          title: true,
          defaultPoints: true,
          _count: { select: { questions: true } },
        },
      },
    },
  });
  res.json(series);
});

publicRouter.get('/series/:id', async (req, res) => {
  const series = await prisma.series.findFirst({
    where: { id: req.params.id, status: 'PUBLISHED' },
    include: {
      tours: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          title: true,
          rules: true,
          defaultPoints: true,
          _count: { select: { questions: true } },
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

  const code = nanoid(8);

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
