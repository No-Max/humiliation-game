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

function syncExpiredTurn() {
  connectSocket().emit('syncExpiredTurn', () => {});
}

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
      :scoring-team-id="state.phase === 'CORRECT' ? state.scoringTeamId : undefined"
      :scoring-points="state.phase === 'CORRECT' ? state.questionValue : undefined"
      @timer-expired="syncExpiredTurn"
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
        <p class="tour-hint text-muted">Нажмите «Начать» на телефоне</p>
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
        <p class="tour-hint text-muted">Нажмите «Начать» на телефоне</p>
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
          :media-urls="isActiveQuestion ? state.mediaUrls : undefined"
        />
        <QuestionChoices
          v-if="state.answerType === 'CHOICE' && state.choices?.length"
          large
          readonly
          :choices="state.choices"
        />
        <QuestionHints :hints="state.hints" :hints-total="state.hintsTotal" />
        <div v-if="state.phase === 'CORRECT'" class="banner correct">
          Верно!
          <span v-if="state.correctAnswer"> · {{ state.correctAnswer }}</span>
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

<style scoped>
.display-screen {
  max-width: none;
  width: 100%;
  min-width: 0;
  padding: 32px 0;
  box-sizing: border-box;
}

.display-screen > * + * {
  margin-top: 24px;
}

.display-screen h1 {
  margin: 0;
  font-size: 40px;
  line-height: 1.2;
  text-align: center;
}

.question-stack {
  display: block;
  margin-top: 16px;
  min-width: 0;
}

.question-stack > * + * {
  margin-top: 16px;
}

.question-stack > :deep(.card) {
  margin-bottom: 0;
}

.tour-results {
  margin: 0;
  display: block;
}

.tour-results > * + * {
  margin-top: 16px;
}

.tour-results-title {
  font-size: 18px;
  margin: 0;
}

.tour-results-row {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
}

.tour-intro-meta {
  color: #6b7280;
  font-size: 15px;
  margin: 0;
  text-align: center;
}

.tour-intro-subtitle {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  line-height: 1.35;
  text-align: left;
}

.tour-rules {
  margin: 0;
  text-align: left;
}

.tour-hint {
  margin: 0;
}

.pause-overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 55%);
  z-index: 900;
  pointer-events: none;
  text-align: center;
  font-size: 0;
  white-space: nowrap;
}

.pause-overlay::before {
  content: '';
  display: inline-block;
  height: 100%;
  vertical-align: middle;
}

.pause-overlay span {
  display: inline-block;
  vertical-align: middle;
  white-space: normal;
  background: #fef3c7;
  color: #92400e;
  font-size: 40px;
  font-weight: bold;
  padding: 24px 48px;
  border-radius: 12px;
}

@media (max-width: 1023px) {
  .display-screen h1 {
    font-size: 32px;
  }
}
</style>
