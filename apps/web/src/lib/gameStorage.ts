import type { GameQuestionResult, RoomState, RoomStatus, TeamState } from '@humiliation-game/shared';

const STORAGE_KEY = 'humiliation-game:sessions';
const FINISHED_PREFIX = 'humiliation-game:finished:';

export interface SavedGameSession {
  roomCode: string;
  teamId: string;
  teamName: string;
  seriesTitle: string;
  status: Exclude<RoomStatus, 'FINISHED'>;
  updatedAt: number;
}

export interface FinishedGameSnapshot {
  roomCode: string;
  seriesId: string;
  seriesTitle: string;
  teams: TeamState[];
  teamOrder: string[];
  gameResults?: GameQuestionResult[];
  savedAt: number;
}

function loadAll(): Record<string, SavedGameSession> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, SavedGameSession>;
  } catch {
    return {};
  }
}

function persist(sessions: Record<string, SavedGameSession>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function saveGameSession(session: SavedGameSession) {
  const all = loadAll();
  all[session.roomCode] = { ...session, updatedAt: Date.now() };
  persist(all);
}

export function updateGameSession(
  roomCode: string,
  patch: Partial<Omit<SavedGameSession, 'roomCode'>>,
) {
  const all = loadAll();
  const existing = all[roomCode];
  if (!existing) return;
  all[roomCode] = { ...existing, ...patch, updatedAt: Date.now() };
  persist(all);
}

export function getUnfinishedGames(): SavedGameSession[] {
  return Object.values(loadAll()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getGameSession(roomCode: string): SavedGameSession | null {
  return loadAll()[roomCode] ?? null;
}

export function removeGameSession(roomCode: string) {
  const all = loadAll();
  delete all[roomCode];
  persist(all);
}

export function saveFinishedGameSnapshot(state: RoomState) {
  const snapshot: FinishedGameSnapshot = {
    roomCode: state.roomCode,
    seriesId: state.seriesId,
    seriesTitle: state.seriesTitle,
    teams: state.teams,
    teamOrder: state.teamOrder,
    gameResults: state.gameResults,
    savedAt: Date.now(),
  };
  localStorage.setItem(`${FINISHED_PREFIX}${state.roomCode}`, JSON.stringify(snapshot));
}

export function getFinishedGameSnapshot(roomCode: string): FinishedGameSnapshot | null {
  try {
    const raw = localStorage.getItem(`${FINISHED_PREFIX}${roomCode}`);
    if (!raw) return null;
    return JSON.parse(raw) as FinishedGameSnapshot;
  } catch {
    return null;
  }
}

export function roomStateFromFinishedSnapshot(snapshot: FinishedGameSnapshot): RoomState {
  return {
    roomCode: snapshot.roomCode,
    seriesId: snapshot.seriesId,
    seriesTitle: snapshot.seriesTitle,
    status: 'FINISHED',
    phase: 'FINISHED',
    teams: snapshot.teams,
    teamOrder: snapshot.teamOrder,
    currentTeamIndex: 0,
    currentTourIndex: 0,
    currentQuestionIndex: 0,
    questionValue: 0,
    valueReduced: false,
    hintShown: false,
    displayCount: 0,
    teamSlots: snapshot.teams.map((team) => ({ teamId: team.id, name: team.name })),
    gameResults: snapshot.gameResults,
  };
}

export function syncFromRoomState(
  roomCode: string,
  teamId: string,
  teamName: string,
  room: RoomState,
) {
  if (room.status === 'FINISHED') {
    saveFinishedGameSnapshot(room);
    removeGameSession(roomCode);
    return;
  }

  saveGameSession({
    roomCode,
    teamId,
    teamName,
    seriesTitle: room.seriesTitle,
    status: room.status as SavedGameSession['status'],
    updatedAt: Date.now(),
  });
}

export function statusLabel(status: SavedGameSession['status']): string {
  switch (status) {
    case 'PAUSED':
      return 'На паузе';
    case 'PLAYING':
      return 'Идёт игра';
    default:
      return 'Ожидание';
  }
}
