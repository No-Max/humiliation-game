import { api } from './api';

export type AuthUser = {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  teamName: string | null;
  teamLogoUrl: string | null;
};

export type TelegramLoginPayload = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

export type SavedGameSummary = {
  roomCode: string;
  seriesId: string;
  seriesTitle: string;
  seriesNumber: number;
  finishedAt: string;
  myTeamId: string;
  myTeamName: string;
  myScore: number;
  teams: Array<{ id: string; name: string; score: number }>;
};

export function fetchAuthConfig() {
  return api<{ telegramBotUsername: string | null }>('/auth/config');
}

export function fetchAuthMe() {
  return api<{ user: AuthUser | null }>('/auth/me');
}

export function loginWithTelegram(payload: TelegramLoginPayload) {
  return api<{ user: AuthUser }>('/auth/telegram', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function logoutAuth() {
  return api<{ ok: boolean }>('/auth/logout', {
    method: 'POST',
    body: '{}',
  });
}

export function updateProfile(teamName: string) {
  return api<{ user: AuthUser }>('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify({ teamName }),
  });
}

export async function uploadTeamLogo(file: File) {
  const body = new FormData();
  body.append('file', file);
  return api<{ user: AuthUser }>('/auth/profile/logo', {
    method: 'POST',
    body,
  });
}

export function claimGame(roomCode: string, teamId: string) {
  return api<{ ok: boolean; saved: boolean }>('/auth/claim-game', {
    method: 'POST',
    body: JSON.stringify({ roomCode, teamId }),
  });
}

export function fetchMyGames() {
  return api<{ games: SavedGameSummary[] }>('/auth/games');
}
