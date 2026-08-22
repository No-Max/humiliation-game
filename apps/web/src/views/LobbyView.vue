<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { RoomState } from '@humiliation-game/shared';
import { api, connectSocket, joinRoom, onRoomState } from '../lib/api';
import { syncFromRoomState } from '../lib/gameStorage';
import { getPreferredTeamName } from '../lib/teamPreferences';
import { getTeamSlotPath, rememberTeamSlot } from '../lib/teamSession';
import GameConnectionPanel from '../components/GameConnectionPanel.vue';

const route = useRoute();
const router = useRouter();
const teamName = ref('');
const loading = ref(false);
const initializing = ref(true);
const error = ref('');
const roomCode = ref('');
const hostTeamId = ref('');
const seriesTitle = ref('');
const roomState = ref<RoomState | null>(null);
const joined = ref(false);
let cleanup: (() => void) | undefined;

const roomCreated = computed(() => Boolean(roomCode.value));

onMounted(async () => {
  teamName.value = getPreferredTeamName();
  if (teamName.value.trim()) {
    await createRoom();
  }
  initializing.value = false;
});

onUnmounted(() => {
  cleanup?.();
});

function onTeamRenamed(name: string) {
  teamName.value = name;
  rememberTeamSlot(roomCode.value, hostTeamId.value, name, seriesTitle.value, 'WAITING');
}

function beginSetup(
  code: string,
  teamId: string,
  title: string,
  name: string,
) {
  roomCode.value = code;
  hostTeamId.value = teamId;
  seriesTitle.value = title;
  teamName.value = name;
  joined.value = false;

  connectSocket();
  cleanup = onRoomState((state) => {
    roomState.value = state;
    syncFromRoomState(code, teamId, teamName.value, state);
  });

  joinRoom({ roomCode: code, role: 'team', teamId }, (result) => {
    if (!result.ok) {
      error.value = result.error ?? 'Не удалось подключиться к комнате';
      roomCode.value = '';
      hostTeamId.value = '';
      return;
    }
    joined.value = true;
    if (result.teamName) teamName.value = result.teamName;
  });
}

async function createRoom() {
  if (!teamName.value.trim()) {
    error.value = 'Введите название команды';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const result = await api<{
      roomCode: string;
      teamId: string;
      seriesTitle?: string;
    }>('/rooms', {
      method: 'POST',
      body: JSON.stringify({
        seriesId: route.params.seriesId,
        teamName: teamName.value.trim(),
      }),
    });
    const name = teamName.value.trim();
    rememberTeamSlot(
      result.roomCode,
      result.teamId,
      name,
      result.seriesTitle ?? 'Игра',
      'WAITING',
    );
    beginSetup(result.roomCode, result.teamId, result.seriesTitle ?? 'Игра', name);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка';
  } finally {
    loading.value = false;
  }
}

function startGame() {
  router.push(getTeamSlotPath(roomCode.value, hostTeamId.value));
}
</script>

<template>
  <div>
    <h1 class="page-title">{{ seriesTitle || 'Создать игру' }}</h1>

    <div class="card">
      <p v-if="initializing || (loading && !roomCreated)" class="hint">
        Создание комнаты…
      </p>

      <template v-else-if="!roomCreated">
        <label>Название вашей команды</label>
        <input
          v-model="teamName"
          class="input"
          placeholder="Например: Знатоки"
          @keyup.enter="createRoom"
        />
        <p class="hint">
          Название сохраняется на этом устройстве — его можно изменить перед игрой.
        </p>
        <p v-if="error" class="error">{{ error }}</p>
        <button class="btn" :disabled="loading" @click="createRoom">
          Продолжить
        </button>
      </template>

      <template v-else>
        <p class="hint setup-hint">
          Пригласите другие команды и откройте экран — когда все будут готовы, начните игру.
        </p>
        <p v-if="error" class="error">{{ error }}</p>

        <GameConnectionPanel
          v-if="joined"
          :room-code="roomCode"
          :team-id="hostTeamId"
          v-model:team-name="teamName"
          :state="roomState"
          intro-text="Ссылки активны до конца игры"
          @team-renamed="onTeamRenamed"
        />
        <p v-else class="hint">Подключение к комнате…</p>

        <button
          class="btn start-game-btn"
          type="button"
          :disabled="!joined"
          @click="startGame"
        >
          Начать игру
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.hint {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 12px;
}

.setup-hint {
  margin-top: 0;
}

.error {
  color: #dc2626;
  margin-bottom: 12px;
}

.start-game-btn {
  width: 100%;
  margin-top: 20px;
}
</style>
