<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { RoomState } from '@humiliation-game/shared';
import { api, connectSocket, joinRoom, onRoomState } from '../lib/api';
import { syncFromRoomState } from '../lib/gameStorage';
import { getPreferredTeamName } from '../lib/teamPreferences';
import { getTeamSlotPath, rememberTeamSlot } from '../lib/teamSession';
import Button from '../components/Button.vue';
import Input from '../components/Input.vue';
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

type SetupStep = 'teams' | 'display';
const setupStep = ref<SetupStep>('teams');
const roomCodeCopyMessage = ref('');

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
  setupStep.value = 'teams';

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

async function copyRoomCode() {
  if (!roomCode.value) return;
  await navigator.clipboard.writeText(roomCode.value);
  roomCodeCopyMessage.value = 'Код комнаты скопирован';
}
</script>

<template>
  <div>
    <h1 class="page-title">{{ seriesTitle || 'Создать игру' }}</h1>

    <div class="card lobby-card">
      <p v-if="initializing || (loading && !roomCreated)" class="hint">
        Создание комнаты…
      </p>

      <template v-else-if="!roomCreated">
        <label>Название вашей команды</label>
        <Input
          v-model="teamName"
          placeholder="Например: Знатоки"
          @keyup.enter="createRoom"
        />
        <p class="hint">
          Название сохраняется на этом устройстве — его можно изменить перед игрой.
        </p>
        <p v-if="error" class="error">{{ error }}</p>
        <Button :disabled="loading" @click="createRoom">
          Продолжить
        </Button>
      </template>

      <template v-else>
        <p class="setup-step-label">
          Шаг {{ setupStep === 'teams' ? '1' : '2' }} из 2 —
          {{ setupStep === 'teams' ? 'Участники' : 'Экран' }}
        </p>
        <p v-if="setupStep === 'teams'" class="hint setup-hint">
          Пригласите соперников и раздайте ссылки на джойстики команд.
        </p>
        <div v-else class="setup-instruction">
          <p class="setup-instruction-title">Как подключить экран</p>
          <ol class="setup-instruction-list">
            <li>На TV, ноуте или планшете откройте сайт ingame.by</li>
            <li>Нажмите кнопку «Смотреть» в шапке и введите код комнаты.</li>
          </ol>
          <div v-if="roomCode" class="setup-room-code-block">
            <span class="setup-room-code-label">Код комнаты:</span>
            <span class="setup-room-code-value">{{ roomCode }}</span>
            <Button
              variant="secondary"
              icon="copy"
              class="setup-room-code-copy"
              compact
              aria-label="Скопировать код комнаты"
              @click="copyRoomCode"
            />
            <p v-if="roomCodeCopyMessage" class="room-code-copy-message">{{ roomCodeCopyMessage }}</p>
          </div>
        </div>
        <p v-if="error" class="error">{{ error }}</p>

        <GameConnectionPanel
          v-if="joined && setupStep === 'teams'"
          :room-code="roomCode"
          :team-id="hostTeamId"
          v-model:team-name="teamName"
          :state="roomState"
          section="teams"
          @team-renamed="onTeamRenamed"
        />
        <div v-else-if="!joined && roomCode && setupStep === 'teams'" class="room-code-row">
          <span class="room-code-label">Код комнаты:</span>
          <span class="room-code-value">{{ roomCode }}</span>
          <Button
            variant="secondary"
            icon="copy"
            class="room-code-copy"
            compact
            aria-label="Скопировать код комнаты"
            @click="copyRoomCode"
          />
          <p v-if="roomCodeCopyMessage" class="room-code-copy-message">{{ roomCodeCopyMessage }}</p>
        </div>

        <Button
          v-if="setupStep === 'teams'"
          block
          class="setup-next-btn"
          :disabled="!joined"
          @click="setupStep = 'display'"
        >
          Далее
        </Button>
        <template v-else>
          <Button variant="secondary" block class="setup-back-btn" @click="setupStep = 'teams'">
            Назад
          </Button>
          <Button block class="start-game-btn" :disabled="!joined" @click="startGame">
            Начать игру
          </Button>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
.lobby-card {
  margin-top: 16px;
}

.hint {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 12px;
}

.setup-step-label {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: bold;
  color: #4f46e5;
}

.setup-hint {
  margin-top: 0;
}

.setup-instruction {
  margin: 0 0 12px;
}

.setup-instruction-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: bold;
  color: #374151;
}

.setup-instruction-list {
  margin: 0;
  padding-left: 20px;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.45;
}

.setup-instruction-list li + li {
  margin-top: 6px;
}

.setup-room-code-block {
  margin-top: 16px;
  font-size: 0;
}

.setup-room-code-label {
  display: block;
  margin-bottom: 8px;
  font-size: 15px;
  font-weight: bold;
  color: #374151;
}

.setup-room-code-value {
  display: inline-block;
  vertical-align: middle;
  font-size: 32px;
  font-weight: bold;
  letter-spacing: 0.2em;
  font-variant-numeric: tabular-nums;
  color: #1a1a2e;
}

.setup-room-code-copy {
  margin-left: 12px;
  vertical-align: middle;
}

.room-code-row {
  margin: 0 0 12px;
  font-size: 0;
}

.room-code-label {
  display: inline-block;
  vertical-align: middle;
  font-size: 14px;
  font-weight: bold;
  color: #374151;
  margin-right: 8px;
}

.room-code-value {
  display: inline-block;
  vertical-align: middle;
  font-size: 26px;
  font-weight: bold;
  letter-spacing: 0.2em;
  font-variant-numeric: tabular-nums;
  color: #1a1a2e;
}

.room-code-copy {
  margin-left: 12px;
  vertical-align: middle;
}

.room-code-copy-message {
  margin: 8px 0 0;
  font-size: 14px;
  color: #059669;
  font-weight: bold;
}

.setup-next-btn,
.setup-back-btn {
  margin-top: 12px;
}

.error {
  color: #dc2626;
  margin-bottom: 12px;
}

.start-game-btn {
  margin-top: 12px;
}
</style>
