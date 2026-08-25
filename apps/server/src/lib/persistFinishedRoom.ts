import { prisma } from './prisma.js';
import type { Prisma } from '@prisma/client';
import type { GameEngine } from '../game/engine.js';
import { parseGameResults } from './gameResults.js';

const persistedFinishedRooms = new Set<string>();

export async function persistFinishedRoom(roomCode: string, engine: GameEngine) {
  if (persistedFinishedRooms.has(roomCode)) return;

  const state = engine.getPublicState();
  const gameResults = state.gameResults ?? [];

  await prisma.$transaction(async (tx) => {
    await tx.gameRoom.update({
      where: { code: roomCode },
      data: {
        status: 'FINISHED',
        gameResults: gameResults as unknown as Prisma.InputJsonValue,
      },
    });

    for (const team of state.teams) {
      await tx.gameTeam.update({
        where: { id: team.id },
        data: { score: team.score },
      });
    }
  });

  persistedFinishedRooms.add(roomCode);
}

export function markFinishedRoomPersisted(roomCode: string) {
  persistedFinishedRooms.add(roomCode);
}

export function restoreFinishedEngine(
  engine: GameEngine,
  gameResults: unknown,
  teams: Array<{ id: string; score: number }>,
) {
  const parsed = parseGameResults(gameResults);
  engine.applyPersistedTeamScores(new Map(teams.map((team) => [team.id, team.score])));
  engine.restoreFinished(parsed);
}
