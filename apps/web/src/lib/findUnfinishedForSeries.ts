import { api } from './api';
import {
  getUnfinishedGames,
  removeGameSession,
  updateGameSession,
  type SavedGameSession,
} from './gameStorage';

/**
 * Находит незавершённую игру этой серии и проверяет, что комната ещё жива.
 * У старых записей без seriesId подтягивает id с сервера.
 */
export async function findUnfinishedForSeries(
  seriesId: string,
): Promise<SavedGameSession | null> {
  const list = getUnfinishedGames();

  for (const session of list) {
    if (session.seriesId !== seriesId) continue;
    try {
      await api(`/rooms/${session.roomCode}`);
      return session;
    } catch {
      removeGameSession(session.roomCode);
    }
  }

  for (const session of list) {
    if (session.seriesId) continue;
    try {
      const room = await api<{ series: { id: string; title: string } }>(
        `/rooms/${session.roomCode}`,
      );
      updateGameSession(session.roomCode, {
        seriesId: room.series.id,
        seriesTitle: room.series.title,
      });
      if (room.series.id === seriesId) {
        return {
          ...session,
          seriesId: room.series.id,
          seriesTitle: room.series.title,
        };
      }
    } catch {
      removeGameSession(session.roomCode);
    }
  }

  return null;
}
