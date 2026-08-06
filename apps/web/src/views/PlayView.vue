<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import type { RoomState } from '@humiliation-game/shared';
import {
  connectSocket,
  disableAutoRejoin,
  joinRoom,
  leaveRoom,
  onRoomState,
  onSocketConnectionChange,
  setAutoRejoin,
} from '../lib/api';
import { syncFromRoomState } from '../lib/gameStorage';
import {
  clearTeamSlot,
  getDisplayUrl,
  getJoinUrl,
  getTeamSlotUrl,
  rememberTeamSlot,
  resolveTeamId,
} from '../lib/teamSession';
import AnswerTimer from '../components/AnswerTimer.vue';
import QuestionContent from '../components/QuestionContent.vue';

const route = useRoute();
const router = useRouter();
const state = ref<RoomState | null>(null);
const answer = ref('');
const message = ref('');
const teamId = ref('');
const teamName = ref('');
const socketConnected = ref(true);
const joined = ref(false);
const showConnectionModal = ref(false);
const showExitModal = ref(false);
let cleanup: (() => void) | undefined;
let connectionCleanup: (() => void) | undefined;

const code = computed(() => route.params.code as string);
const routeTeamId = computed(() => {
  const fromRoute = route.params.teamId as string | undefined;
  return fromRoute ?? (route.query.team as string | undefined);
});

const displayUrl = computed(() => getDisplayUrl(code.value));
const joinUrl = computed(() => getJoinUrl(code.value));
const mySlotUrl = computed(() =>
  teamId.value ? getTeamSlotUrl(code.value, teamId.value) : '',
);

const linksActive = computed(() => state.value?.status !== 'FINISHED');
const isPaused = computed(() => state.value?.status === 'PAUSED');
const isMyTurn = computed(
  () =>
    !isPaused.value &&
    state.value?.activeTeamId &&
    state.value.activeTeamId === teamId.value,
);
const myTeam = computed(() => state.value?.teams.find((t) => t.id === teamId.value));
const canSubmit = computed(() => answer.value.trim().length > 0);
const isActiveQuestion = computed(
  () =>
    state.value?.phase === 'QUESTION' || state.value?.phase === 'STEAL_ROUND',
);
const offlineActiveTeam = computed(() => {
  if (!state.value?.activeTeamId) return null;
  const team = state.value.teams.find((t) => t.id === state.value!.activeTeamId);
  return team && !team.connected ? team : null;
});

function doJoin() {
  if (!teamId.value || !linksActive.value) return;

  joinRoom(
    { roomCode: code.value, role: 'team', teamId: teamId.value },
    (result) => {
      if (!result.ok) {
        message.value = result.error ?? 'Не удалось подключиться';
        joined.value = false;
        return;
      }
      joined.value = true;
      message.value = '';
      if (result.teamId) teamId.value = result.teamId;
      if (result.teamName) {
        teamName.value = result.teamName;
        rememberTeamSlot(
          code.value,
          teamId.value,
          result.teamName,
          state.value?.seriesTitle ?? 'Игра',
          state.value?.status === 'PAUSED' ? 'PAUSED' : 'PLAYING',
        );
      }
    },
  );
}

onMounted(() => {
  teamId.value = resolveTeamId(code.value, routeTeamId.value) ?? '';
  connectSocket();

  cleanup = onRoomState((s) => {
    state.value = s;
    if (teamId.value) {
      const name =
        teamName.value ||
        s.teams.find((t) => t.id === teamId.value)?.name ||
        'Команда';
      teamName.value = name;
      syncFromRoomState(code.value, teamId.value, name, s);
    } else if (s.status === 'FINISHED') {
      clearTeamSlot(code.value);
    }
  });

  connectionCleanup = onSocketConnectionChange((connected) => {
    socketConnected.value = connected;
  });

  setAutoRejoin(() =>
    teamId.value && linksActive.value
      ? { roomCode: code.value, role: 'team', teamId: teamId.value }
      : null,
  );

  if (teamId.value) {
    doJoin();
  }
});

watch(routeTeamId, (id) => {
  if (id && id !== teamId.value) {
    teamId.value = id;
    doJoin();
  }
});

onUnmounted(() => {
  cleanup?.();
  connectionCleanup?.();
});

function startTour() {
  connectSocket().emit('startTour', (result) => {
    if (!result.ok) message.value = result.error ?? 'Ошибка';
  });
}

function submit() {
  if (!canSubmit.value) return;
  connectSocket().emit('submitAnswer', answer.value, (result) => {
    if (!result.ok) {
      message.value = result.error ?? 'Ошибка';
      return;
    }
    if (result.correct === false) {
      message.value = '';
    } else if (result.correct) {
      message.value = '';
    }
    answer.value = '';
  });
}

function pass() {
  connectSocket().emit('pass', (result) => {
    if (!result.ok) message.value = result.error ?? 'Ошибка';
  });
}

function nextQuestion() {
  connectSocket().emit('nextQuestion', (result) => {
    if (!result.ok) message.value = result.error ?? 'Ошибка';
  });
}

function reconnect() {
  message.value = '';
  doJoin();
}

async function copy(text: string, label: string) {
  await navigator.clipboard.writeText(text);
  message.value = `${label} скопирована`;
}

function openConnection() {
  showConnectionModal.value = true;
}

function closeConnection() {
  showConnectionModal.value = false;
}

function pauseGame() {
  connectSocket().emit('pauseGame', (result) => {
    if (!result.ok) message.value = result.error ?? 'Ошибка';
  });
}

function resumeGame() {
  connectSocket().emit('resumeGame', (result) => {
    if (!result.ok) message.value = result.error ?? 'Ошибка';
  });
}

function openExit() {
  showExitModal.value = true;
}

function closeExit() {
  showExitModal.value = false;
}

function confirmExit() {
  const socket = connectSocket();

  const navigateAway = () => {
    disableAutoRejoin();
    joined.value = false;
    socket.disconnect();
    router.push('/series');
  };

  if (state.value?.status === 'PLAYING') {
    socket.emit('pauseGame', () => {
      leaveRoom(() => navigateAway());
    });
  } else {
    leaveRoom(() => navigateAway());
  }
}
</script>

<template>
  <div>
    <div class="page-actions">
      <h1 class="page-title" style="margin: 0; flex: 1">{{ state?.seriesTitle ?? 'Игра' }}</h1>
      <template v-if="linksActive && joined">
        <button
          v-if="!isPaused"
          class="btn btn-secondary"
          type="button"
          @click="pauseGame"
        >
          Пауза
        </button>
        <button
          v-else
          class="btn"
          type="button"
          @click="resumeGame"
        >
          Продолжить
        </button>
        <button class="btn btn-secondary" type="button" @click="openExit">
          Выйти
        </button>
      </template>
      <button
        v-if="linksActive"
        class="btn btn-secondary"
        type="button"
        @click="openConnection"
      >
        Подключение
      </button>
    </div>

    <div v-if="isPaused" class="pause-banner">
      ⏸ Игра на паузе
      <span v-if="state?.pausedBy"> ({{ state.pausedBy }})</span>
      — нажмите «Продолжить», когда будете готовы
    </div>

    <div v-if="!socketConnected" class="card banner wrong">
      Связь потеряна… Переподключаемся
    </div>

    <div v-if="state?.status === 'FINISHED'" class="card banner wrong">
      Игра завершена — ссылки больше не активны
    </div>

    <div v-else-if="!teamId" class="card">
      <p>Командный слот не выбран.</p>
      <RouterLink :to="`/join/${code}`" class="btn">Подключиться к комнате</RouterLink>
    </div>

    <div v-else-if="!joined && teamId && linksActive" class="card">
      <p>Не удалось занять командный слот.</p>
      <button class="btn" @click="reconnect">Подключиться снова</button>
    </div>

    <div v-if="state" class="scoreboard">
      <div
        v-for="team in state.teams"
        :key="team.id"
        class="team-score"
        :class="{ active: team.id === state.activeTeamId }"
      >
        <div>{{ team.name }}</div>
        <strong>{{ team.score }}</strong>
        <small v-if="!team.connected" style="color: #ef4444; display: block">offline</small>
        <small v-if="team.passed" style="color: #9ca3af; display: block">сдалась</small>
      </div>
    </div>

    <div v-if="offlineActiveTeam" class="card hint" style="margin-top: 1rem">
      <strong>{{ offlineActiveTeam.name }}</strong> offline —
      откройте ссылку командного слота на другом телефоне.
      <button class="btn btn-secondary" style="margin-top: 0.75rem" @click="openConnection">
        Подключение
      </button>
    </div>

    <div
      v-if="(state?.questionPrompt || state?.mediaUrls?.length) && isActiveQuestion"
      class="card"
      style="margin-top: 1rem"
    >
      <p v-if="state.tourTitle" style="color: #6b7280; font-size: 0.875rem">{{ state.tourTitle }}</p>
      <div v-if="state.turnNotice" class="banner wrong turn-notice">{{ state.turnNotice }}</div>
      <p v-if="state.phase === 'STEAL_ROUND'" class="steal-round-label">Раунд украсть</p>
      <AnswerTimer
        v-if="state.activeTeamId && !isPaused"
        :deadline-at="state.answerDeadlineAt"
        :paused="isPaused"
      />
      <QuestionContent :prompt="state.questionPrompt" :media-urls="state.mediaUrls" />
      <div v-if="state.hints?.length" class="hints-list">
        <p v-if="state.hintsTotal" class="hints-caption">
          Подсказки {{ state.hints.length }} из {{ state.hintsTotal }}
        </p>
        <p v-for="(hint, index) in state.hints" :key="`${index}-${hint}`" class="hint" :class="{ 'hint-latest': index === state.hints.length - 1 }">
          💡 {{ index + 1 }}. {{ hint }}
        </p>
      </div>

      <template v-if="isMyTurn && myTeam?.connected !== false">
        <p style="margin-top: 1rem">Ваш ход · {{ state.questionValue }} балл(ов)</p>
        <input v-model="answer" class="input" placeholder="Ваш ответ" @keyup.enter="submit" />
        <div style="display: flex; gap: 0.5rem">
          <button class="btn" :disabled="!canSubmit" @click="submit">Ответить</button>
          <button class="btn btn-secondary" @click="pass">Сдаёмся</button>
        </div>
      </template>
      <p v-else-if="!isPaused" style="margin-top: 1rem; color: #6b7280">
        Ожидайте хода другой команды
      </p>
    </div>

    <div v-if="showConnectionModal && linksActive" class="modal-overlay" @click.self="closeConnection">
      <div class="modal" role="dialog" aria-labelledby="connection-title">
        <div class="modal-header">
          <h2 id="connection-title">Подключение</h2>
          <button class="modal-close" type="button" aria-label="Закрыть" @click="closeConnection">×</button>
        </div>
        <div class="modal-body">
          <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 1rem">
            Ссылки активны до конца игры
          </p>

          <div class="link-block">
            <strong>📺 Экран</strong>
            <p class="link-desc">
              TV, ноут, планшет — только показ. Можно открыть на нескольких устройствах.
            </p>
            <p class="link-url">{{ displayUrl }}</p>
            <button class="btn btn-secondary" @click="copy(displayUrl, 'Ссылка экрана')">
              Копировать
            </button>
          </div>

          <div v-if="mySlotUrl" class="link-block">
            <strong>📱 Командный слот{{ teamName ? `: ${teamName}` : '' }}</strong>
            <p class="link-desc">
              Джойстик команды. Любой телефон команды может подключиться —
              предыдущее устройство отключится.
            </p>
            <p class="link-url highlight">{{ mySlotUrl }}</p>
            <button class="btn btn-secondary" @click="copy(mySlotUrl, 'Ссылка слота')">
              Копировать
            </button>
          </div>

          <div v-if="state?.teamSlots?.length" class="link-block">
            <strong>Все командные слоты</strong>
            <div v-for="slot in state.teamSlots" :key="slot.teamId" style="margin-top: 0.5rem">
              <span style="font-size: 0.875rem">{{ slot.name }}</span>
              <p class="link-url">{{ getTeamSlotUrl(code, slot.teamId) }}</p>
            </div>
          </div>

          <div class="link-block">
            <strong>➕ Новая команда</strong>
            <p class="link-desc">Только для соперника, который ещё не в игре.</p>
            <p class="link-url">{{ joinUrl }}</p>
            <button class="btn btn-secondary" @click="copy(joinUrl, 'Ссылка для соперника')">
              Копировать
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="state?.phase === 'TOUR_INTRO' && !isPaused" class="card">
      <p>Готовы начать тур «{{ state.tourTitle }}»?</p>
      <button class="btn" @click="startTour">Начать тур</button>
    </div>

    <div v-else-if="state?.phase === 'CORRECT' && !isPaused" class="card">
      <div class="banner correct">Верно! +{{ state.questionValue }}</div>
      <p v-if="state.correctAnswer">
        Правильный ответ: <strong>{{ state.correctAnswer }}</strong>
      </p>
      <button class="btn" style="margin-top: 1rem" @click="nextQuestion">Следующий вопрос</button>
    </div>

    <div v-else-if="state?.phase === 'REVEAL' && !isPaused" class="card">
      <div class="banner wrong">Никто не угадал</div>
      <p v-if="state.correctAnswer">
        Правильный ответ: <strong>{{ state.correctAnswer }}</strong>
      </p>
      <button class="btn" style="margin-top: 1rem" @click="nextQuestion">Следующий вопрос</button>
    </div>

    <div v-else-if="state?.phase === 'FINISHED'" class="card">
      <div class="banner correct">Игра окончена!</div>
      <div v-for="team in state.teams" :key="team.id" style="margin-top: 0.5rem">
        {{ team.name }}: {{ team.score }} баллов
      </div>
    </div>

    <div v-if="showExitModal" class="modal-overlay" @click.self="closeExit">
      <div class="modal" role="dialog" aria-labelledby="exit-title">
        <div class="modal-header">
          <h2 id="exit-title">Выйти из игры?</h2>
          <button class="modal-close" type="button" aria-label="Закрыть" @click="closeExit">×</button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 1rem">
            Игра будет поставлена на паузу. Вернитесь по ссылке командного слота, когда будете готовы.
          </p>
          <div style="display: flex; gap: 0.5rem">
            <button class="btn" @click="confirmExit">Выйти</button>
            <button class="btn btn-secondary" @click="closeExit">Отмена</button>
          </div>
        </div>
      </div>
    </div>

    <p
      v-if="message"
      :style="{ color: message.includes('скопирован') ? '#059669' : '#dc2626', marginTop: '1rem' }"
    >
      {{ message }}
    </p>
  </div>
</template>
