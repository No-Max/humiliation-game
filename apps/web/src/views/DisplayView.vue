<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { RoomState } from '@humiliation-game/shared';
import {
  teamsSortedByScore,
  formatTourLabel,
  formatTourQuestionMeta,
  playScreenTitle,
} from '@humiliation-game/shared';
import { connectSocket, onRoomState } from '../lib/api';
import QuestionChoices from '../components/QuestionChoices.vue';
import QuestionContent from '../components/QuestionContent.vue';
import QuestionHints from '../components/QuestionHints.vue';
import QuestionMetaCard from '../components/QuestionMetaCard.vue';
import AnswerRevealMedia from '../components/AnswerRevealMedia.vue';
import PlayScoreboard from '../components/play/PlayScoreboard.vue';

const route = useRoute();
const state = ref<RoomState | null>(null);
const showTourResults = computed(
  () => state.value?.phase === 'TOUR_INTRO' && (state.value.currentTourIndex ?? 0) > 0,
);
const tourResultsTeams = computed(() =>
  state.value ? teamsSortedByScore(state.value.teams) : [],
);
const isActiveQuestion = computed(
  () =>
    state.value?.phase === 'QUESTION' || state.value?.phase === 'STEAL_ROUND',
);
const headerTitle = computed(() =>
  state.value ? playScreenTitle(state.value) : 'Загрузка...',
);
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

    <h1>{{ headerTitle }}</h1>

    <PlayScoreboard
      v-if="state"
      :teams="state.teams"
      :active-team-id="state.activeTeamId"
      :answer-deadline-at="state.answerDeadlineAt"
      :is-paused="state.status === 'PAUSED'"
      :show-timer="isActiveQuestion"
      style="margin: 1.5rem 0"
    />

    <div v-if="state?.phase === 'TOUR_INTRO'" class="card">
      <template v-if="showTourResults">
        <div class="banner correct tour-results">
          <p class="tour-results-title">Итоги тура</p>
          <p v-for="team in tourResultsTeams" :key="team.id" class="tour-results-row">
            {{ team.name }} — {{ team.score }}
          </p>
        </div>
        <p>Следующий тур: {{ formatTourLabel(state.currentTourIndex, state.tourTitle) }}</p>
        <p v-if="state.tourQuestionCount != null" class="tour-intro-meta">
          {{ formatTourQuestionMeta(state.tourQuestionCount, state.limitQuestionsToTeamCount) }}
        </p>
        <template v-if="state.mediaUrls?.length">
          <h3 class="tour-intro-subtitle">Пример задания</h3>
          <QuestionContent large :media-urls="state.mediaUrls" />
        </template>
        <div
          v-if="state.tourRules"
          class="rich-text-preview tour-rules"
          v-html="state.tourRules"
        />
        <p style="color: #6b7280">Нажмите «Начать» на телефоне</p>
      </template>
      <template v-else>
        <h2>{{ formatTourLabel(state.currentTourIndex, state.tourTitle) }}</h2>
        <p v-if="state.tourQuestionCount != null" class="tour-intro-meta">
          {{ formatTourQuestionMeta(state.tourQuestionCount, state.limitQuestionsToTeamCount) }}
        </p>
        <template v-if="state.mediaUrls?.length">
          <h3 class="tour-intro-subtitle">Пример задания</h3>
          <QuestionContent large :media-urls="state.mediaUrls" />
        </template>
        <div
          v-if="state.tourRules"
          class="rich-text-preview tour-rules"
          v-html="state.tourRules"
        />
        <p>Нажмите «Начать» на телефоне</p>
      </template>
    </div>

    <div
      v-else-if="state && (state.questionPrompt || state.mediaUrls?.length || (state.answerType === 'CHOICE' && state.choices?.length))"
      class="question-stack"
    >
      <QuestionMetaCard :state="state" />
      <div class="card">
        <QuestionContent
          large
          :prompt="state.questionPrompt"
          :media-urls="state.mediaUrls"
        />
        <QuestionChoices
          v-if="state.answerType === 'CHOICE' && state.choices?.length"
          large
          readonly
          :choices="state.choices"
        />
        <QuestionHints :hints="state.hints" :hints-total="state.hintsTotal" />
        <div v-if="state.phase === 'CORRECT'" class="banner correct">
          Верный ответ: {{ state.correctAnswer }}
        </div>
        <div v-if="state.phase === 'REVEAL'" class="banner wrong">
          Правильный ответ: {{ state.correctAnswer }}
        </div>
        <AnswerRevealMedia
          v-if="state.phase === 'CORRECT' || state.phase === 'REVEAL'"
          large
          :items="state.answerMedia"
        />
      </div>
    </div>

    <div v-if="state?.phase === 'FINISHED'" class="card">
      <div class="banner correct tour-results">
        <p class="tour-results-title">Игра окончена</p>
        <p v-for="team in tourResultsTeams" :key="team.id" class="tour-results-row">
          {{ team.name }} — {{ team.score }}
        </p>
      </div>
    </div>
  </div>
</template>
