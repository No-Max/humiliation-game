import { computed, ref } from 'vue';
import {
  getUnfinishedGames,
  removeGameSession,
  type SavedGameSession,
} from '../lib/gameStorage';
import { api } from '../lib/api';

const sessions = ref<SavedGameSession[]>([]);
const loading = ref(true);
const initialized = ref(false);

export function shouldShowUnfinishedPrompt(path: string) {
  return path === '/series';
}

async function verifySessions(list: SavedGameSession[]) {
  const valid: SavedGameSession[] = [];
  for (const session of list) {
    try {
      await api(`/rooms/${session.roomCode}`);
      valid.push(session);
    } catch {
      removeGameSession(session.roomCode);
    }
  }
  return valid;
}

export function useUnfinishedGames() {
  const hasUnfinished = computed(() => sessions.value.length > 0);

  async function refresh() {
    const isInitial = !initialized.value;
    if (isInitial) {
      loading.value = true;
    }
    sessions.value = await verifySessions(getUnfinishedGames());
    loading.value = false;
    initialized.value = true;
  }

  function dismiss(roomCode: string) {
    removeGameSession(roomCode);
    sessions.value = sessions.value.filter((s) => s.roomCode !== roomCode);
  }

  return {
    sessions,
    loading,
    hasUnfinished,
    refresh,
    dismiss,
  };
}
