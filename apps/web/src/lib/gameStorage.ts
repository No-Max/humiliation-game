import type { RoomStatus } from '@humiliation-game/shared';

const STORAGE_KEY = 'humiliation-game:sessions';

export interface SavedGameSession {
  roomCode: string;
  teamId: string;
  teamName: string;
  seriesTitle: string;
  status: Exclude<RoomStatus, 'FINISHED'>;
  updatedAt: number;
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

export function syncFromRoomState(
  roomCode: string,
  teamId: string,
  teamName: string,
  room: {
    seriesTitle: string;
    status: RoomStatus;
  },
) {
  if (room.status === 'FINISHED') {
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
