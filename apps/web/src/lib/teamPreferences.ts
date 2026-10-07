import { MAX_TEAM_NAME_LENGTH } from '@humiliation-game/shared';

const STORAGE_KEY = 'humiliation-game:preferred-team-name';

export function getPreferredTeamName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY)?.trim().slice(0, MAX_TEAM_NAME_LENGTH) ?? '';
  } catch {
    return '';
  }
}

export function setPreferredTeamName(name: string) {
  const trimmed = name.trim().slice(0, MAX_TEAM_NAME_LENGTH);
  if (!trimmed) return;
  try {
    localStorage.setItem(STORAGE_KEY, trimmed);
  } catch {
    // ignore quota / private mode
  }
}
