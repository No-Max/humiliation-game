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
import Button from './Button.vue';

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
    <h2 class="unfinished-title">Незавершённые игры</h2>
    <p class="unfinished-intro text-muted-sm">
      У вас есть сохранённые игры — продолжите с того места, где остановились
    </p>
    <div v-for="session in sessions" :key="session.roomCode" class="unfinished-item">
      <div class="unfinished-item-content">
        <strong>{{ session.seriesTitle }}</strong>
        <span class="unfinished-meta text-muted-sm">
          {{ session.teamName }} · {{ statusLabel(session.status) }}
        </span>
      </div>
      <div class="unfinished-actions">
        <Button @click="continueGame(session)">Продолжить</Button>
        <Button variant="secondary" @click="dismiss(session)">Убрать</Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.unfinished-games {
  border-left: 4px solid #4f46e5;
}

.unfinished-title {
  margin-bottom: 8px;
}

.unfinished-intro {
  margin-bottom: 16px;
}

.unfinished-meta {
  display: inline;
}

.unfinished-item {
  display: inline-block;
  padding: 12px 0;
  border-top: 1px solid #e5e7eb;
  width: 100%;
}

.unfinished-item-content {
  display: inline-block;
  vertical-align: middle;
  width: calc(100% - 250px);
}

.unfinished-item::after {
  content: '';
  display: table;
  clear: both;
}

.unfinished-item:first-of-type {
  border-top: none;
  padding-top: 0;
}

.unfinished-actions {
  float: right;
  display: inline-block;
  vertical-align: middle;
  font-size: 0;
}

.unfinished-actions>* {
  display: inline-block;
  vertical-align: middle;
  font-size: 16px;
  margin-left: 8px;
}

.unfinished-actions>*:first-child {
  margin-left: 0;
}
</style>
