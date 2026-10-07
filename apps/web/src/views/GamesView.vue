<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import UnfinishedGamesList from '../components/UnfinishedGamesList.vue';
import { useUnfinishedGames } from '../composables/useUnfinishedGames';
import { useAuth } from '../composables/useAuth';
import { fetchMyGames, type SavedGameSummary } from '../lib/authApi';
import { formatPublishedAt } from '../lib/dates';

const { sessions, loading, refresh, dismiss } = useUnfinishedGames();
const { isAuthenticated, ready } = useAuth();

const history = ref<SavedGameSummary[]>([]);
const historyLoading = ref(false);
const historyError = ref('');

async function loadHistory() {
  if (!isAuthenticated.value) {
    history.value = [];
    return;
  }
  historyLoading.value = true;
  historyError.value = '';
  try {
    const data = await fetchMyGames();
    history.value = data.games;
  } catch (e) {
    historyError.value = e instanceof Error ? e.message : 'Не удалось загрузить историю';
    history.value = [];
  } finally {
    historyLoading.value = false;
  }
}

onMounted(async () => {
  await refresh();
  if (ready.value) await loadHistory();
});

watch([ready, isAuthenticated], async ([isReady, authed]) => {
  if (isReady && authed) await loadHistory();
  if (isReady && !authed) history.value = [];
});
</script>

<template>
  <div>
    <h1 class="page-title">Игры</h1>
    <div v-if="loading" class="card">
      <p class="text-muted-sm">Загрузка…</p>
    </div>
    <div v-else-if="!sessions.length" class="card">
      <p class="text-muted-sm">Незавершённых игр нет.</p>
    </div>
    <div v-else class="card unfinished-games-card">
      <h2 class="section-title">Незавершённые игры</h2>
      <p class="section-intro text-muted-sm">
        У вас есть сохранённые игры — продолжите с того места, где остановились
      </p>
      <UnfinishedGamesList :sessions="sessions" @dismiss="dismiss" />
    </div>

    <div v-if="isAuthenticated" class="card history-card">
      <h2 class="section-title">Сыгранные серии</h2>
      <p v-if="historyLoading" class="text-muted-sm">Загрузка истории…</p>
      <p v-else-if="historyError" class="text-error">{{ historyError }}</p>
      <p v-else-if="!history.length" class="text-muted-sm">
        Пока нет сохранённых результатов. Завершите игру и сохраните её через Telegram.
      </p>
      <ul v-else class="history-list">
        <li v-for="game in history" :key="game.roomCode" class="history-item">
          <RouterLink :to="`/series/${game.seriesId}`" class="history-title">
            #{{ game.seriesNumber }}: {{ game.seriesTitle }}
          </RouterLink>
          <p class="history-meta text-muted-sm">
            {{ game.myTeamName }} — {{ game.myScore }}
            <template v-if="game.finishedAt">
              · {{ formatPublishedAt(game.finishedAt) }}
            </template>
          </p>
          <p class="history-scores text-muted-sm">
            {{ game.teams.map((t) => `${t.name}: ${t.score}`).join(' · ') }}
          </p>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.unfinished-games-card {
  border-left: 4px solid var(--color-accent);
  margin-top: 16px;
}

.history-card {
  margin-top: 16px;
}

.section-title {
  margin-bottom: 8px;
}

.section-intro {
  margin-bottom: 16px;
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.history-item {
  padding: 12px 0;
  border-top: 1px solid #e5e7eb;
}

.history-item:first-child {
  border-top: none;
  padding-top: 0;
}

.history-title {
  font-weight: bold;
  color: inherit;
  text-decoration: none;
}

.history-title:hover {
  color: var(--color-accent);
}

.history-meta,
.history-scores {
  margin: 4px 0 0;
}
</style>
