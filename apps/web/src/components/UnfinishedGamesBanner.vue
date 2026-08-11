<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  getUnfinishedGames,
  removeGameSession,
  statusLabel,
  type SavedGameSession,
} from '../lib/gameStorage';
import { getTeamSlotPath } from '../lib/teamSession';
import { api } from '../lib/api';

const route = useRoute();
const router = useRouter();
const sessions = ref<SavedGameSession[]>([]);
const loading = ref(true);

function isHiddenRoute() {
  return (
    route.path.startsWith('/team/') ||
    route.path.startsWith('/display/') ||
    route.path.startsWith('/lobby/')
  );
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

async function load() {
  if (isHiddenRoute()) {
    sessions.value = [];
    loading.value = false;
    return;
  }
  loading.value = true;
  sessions.value = await verifySessions(getUnfinishedGames());
  loading.value = false;
}

onMounted(load);
watch(() => route.path, load);

function continueGame(session: SavedGameSession) {
  router.push(getTeamSlotPath(session.roomCode, session.teamId));
}

function dismiss(session: SavedGameSession) {
  removeGameSession(session.roomCode);
  sessions.value = sessions.value.filter((s) => s.roomCode !== session.roomCode);
}
</script>

<template>
  <div v-if="!loading && sessions.length && !isHiddenRoute()" class="card unfinished-games">
    <h2 style="margin-bottom: 0.5rem">Незавершённые игры</h2>
    <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem">
      У вас есть сохранённые игры — продолжите с того места, где остановились
    </p>
    <div v-for="session in sessions" :key="session.roomCode" class="unfinished-item">
      <div>
        <strong>{{ session.seriesTitle }}</strong>
        <span style="color: #6b7280; font-size: 0.875rem">
          · {{ session.teamName }} · {{ statusLabel(session.status) }}
        </span>
      </div>
      <div class="unfinished-actions">
        <button class="btn" type="button" @click="continueGame(session)">Продолжить</button>
        <button class="btn btn-secondary" type="button" @click="dismiss(session)">Убрать</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.unfinished-games {
  border-left: 4px solid #4f46e5;
}

.unfinished-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-top: 1px solid #e5e7eb;
}

.unfinished-item:first-of-type {
  border-top: none;
  padding-top: 0;
}

.unfinished-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
