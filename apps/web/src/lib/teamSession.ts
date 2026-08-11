import { getGameSession, removeGameSession, saveGameSession } from './gameStorage';
import { setPreferredTeamName } from './teamPreferences';

export function getDisplayUrl(roomCode: string): string {
  return `${window.location.origin}/display/${roomCode}`;
}

export function getJoinUrl(roomCode: string): string {
  return `${window.location.origin}/join/${roomCode}`;
}

/** Постоянная ссылка командного слота — действует до конца игры */
export function getTeamSlotUrl(roomCode: string, teamId: string): string {
  return `${window.location.origin}/team/${roomCode}/${teamId}`;
}

export function getTeamSlotPath(roomCode: string, teamId: string): string {
  return `/team/${roomCode}/${teamId}`;
}

export function rememberTeamSlot(
  roomCode: string,
  teamId: string,
  teamName: string,
  seriesTitle = 'Игра',
  status: 'PLAYING' | 'PAUSED' | 'WAITING' = 'PLAYING',
) {
  saveGameSession({
    roomCode,
    teamId,
    teamName,
    seriesTitle,
    status,
    updatedAt: Date.now(),
  });
  setPreferredTeamName(teamName);
}

export function clearTeamSlot(roomCode: string) {
  removeGameSession(roomCode);
}

export function resolveTeamId(
  roomCode: string,
  routeTeamId?: string | null,
): string | null {
  if (routeTeamId) return routeTeamId;
  return getGameSession(roomCode)?.teamId ?? null;
}
