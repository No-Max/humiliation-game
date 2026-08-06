<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { RoomState } from '@humiliation-game/shared';
import { connectSocket, onRoomState } from '../lib/api';
import AnswerTimer from '../components/AnswerTimer.vue';
import QuestionContent from '../components/QuestionContent.vue';

const route = useRoute();
const state = ref<RoomState | null>(null);
let cleanup: (() => void) | undefined;

onMounted(() => {
  const code = route.params.code as string;
  const socket = connectSocket();

  cleanup = onRoomState((s) => {
    state.value = s;
  });

  socket.emit('joinRoom', { roomCode: code, role: 'display' }, () => {});
});

onUnmounted(() => cleanup?.());
</script>

<template>
  <div class="display-screen">
    <div v-if="state?.status === 'PAUSED'" class="pause-overlay">
      <span>⏸ ПАУЗА</span>
    </div>

    <h1>{{ state?.seriesTitle ?? 'Загрузка...' }}</h1>

    <div v-if="state" class="scoreboard" style="margin: 1.5rem 0">
      <div
        v-for="team in state.teams"
        :key="team.id"
        class="team-score"
        :class="{ active: team.id === state.activeTeamId }"
      >
        <div>{{ team.name }}</div>
        <strong style="font-size: 1.5rem">{{ team.score }}</strong>
        <small v-if="!team.connected" style="color: #ef4444">offline</small>
      </div>
    </div>

    <div v-if="state?.phase === 'TOUR_INTRO'" class="card">
      <h2>Тур: {{ state.tourTitle }}</h2>
      <p>Нажмите «Начать» на телефоне</p>
    </div>

    <div
      v-else-if="state && (state.questionPrompt || state.mediaUrls?.length)"
      class="card"
    >
      <p style="text-align: center; color: #6b7280">
        {{ state.tourTitle }} · {{ state.questionValue }} б.
        <span v-if="state.activeTeamId">
          · ход {{ state.teams.find(t => t.id === state.activeTeamId)?.name }}
        </span>
      </p>
      <div v-if="state.activeTeamId && state.status !== 'PAUSED'" style="text-align: center">
        <AnswerTimer :deadline-at="state.answerDeadlineAt" :paused="state.status === 'PAUSED'" />
      </div>
      <div v-if="state.turnNotice" class="banner wrong turn-notice">{{ state.turnNotice }}</div>
      <QuestionContent
        large
        :prompt="state.questionPrompt"
        :media-urls="state.mediaUrls"
      />
      <div v-if="state.hints?.length" class="hints-list">
        <p v-if="state.hintsTotal" class="hints-caption">
          Подсказки {{ state.hints.length }} из {{ state.hintsTotal }}
        </p>
        <p
          v-for="(hint, index) in state.hints"
          :key="`${index}-${hint}`"
          class="hint"
          :class="{ 'hint-latest': index === state.hints.length - 1 }"
        >
          💡 {{ index + 1 }}. {{ hint }}
        </p>
      </div>
      <div v-if="state.phase === 'CORRECT'" class="banner correct">
        Верный ответ: {{ state.correctAnswer }}
      </div>
      <div v-if="state.phase === 'REVEAL'" class="banner wrong">
        Правильный ответ: {{ state.correctAnswer }}
      </div>
    </div>

    <div v-if="state?.phase === 'FINISHED'" class="card">
      <h2>Игра окончена</h2>
      <p v-for="team in state.teams" :key="team.id" style="font-size: 1.25rem; margin-top: 0.5rem">
        {{ team.name }} — {{ team.score }}
      </p>
    </div>
  </div>
</template>
