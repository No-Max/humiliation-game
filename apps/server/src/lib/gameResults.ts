import type { GameQuestionResult, RoomState } from '@humiliation-game/shared';

export function parseGameResults(value: unknown): GameQuestionResult[] {
  if (!Array.isArray(value)) return [];

  const results: GameQuestionResult[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as Record<string, unknown>;
    const tourIndex = item.tourIndex;
    const questionIndex = item.questionIndex;
    const correctAnswer = item.correctAnswer;
    const points = item.points;
    const scoringTeamId = item.scoringTeamId;

    if (
      typeof tourIndex !== 'number' ||
      typeof questionIndex !== 'number' ||
      typeof correctAnswer !== 'string' ||
      typeof points !== 'number'
    ) {
      continue;
    }

    results.push({
      tourIndex,
      questionIndex,
      correctAnswer,
      points,
      scoringTeamId: typeof scoringTeamId === 'string' ? scoringTeamId : undefined,
    });
  }

  return results;
}

type FinishedRoomRecord = {
  code: string;
  seriesId: string;
  gameResults: unknown;
  series: { title: string };
  teams: Array<{
    id: string;
    name: string;
    logoUrl: string | null;
    score: number;
    sortOrder: number;
  }>;
};

export function buildFinishedRoomState(room: FinishedRoomRecord): RoomState {
  const teamOrder = [...room.teams]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((team) => team.id);
  const gameResults = parseGameResults(room.gameResults);

  return {
    roomCode: room.code,
    seriesId: room.seriesId,
    seriesTitle: room.series.title,
    status: 'FINISHED',
    phase: 'FINISHED',
    teams: room.teams
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((team) => ({
        id: team.id,
        name: team.name,
        logoUrl: team.logoUrl ?? undefined,
        score: team.score,
        connected: false,
        passed: false,
        attempted: false,
      })),
    teamOrder,
    currentTeamIndex: 0,
    currentTourIndex: 0,
    currentQuestionIndex: 0,
    questionValue: 0,
    valueReduced: false,
    hintShown: false,
    displayCount: 0,
    teamSlots: room.teams.map((team) => ({ teamId: team.id, name: team.name })),
    gameResults: gameResults.length ? gameResults : undefined,
  };
}
