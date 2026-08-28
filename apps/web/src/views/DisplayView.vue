<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { RoomState } from "@humiliation-game/shared";
import {
  teamsSortedByScore,
  formatTourLabel,
  formatTourQuestionMeta,
  playScreenTitle,
} from "@humiliation-game/shared";
import { api, connectSocket, joinRoom, leaveRoom, onRoomState } from "../lib/api";
import {
  getFinishedGameSnapshot,
  roomStateFromFinishedSnapshot,
  saveFinishedGameSnapshot,
} from "../lib/gameStorage";
import QuestionChoices from "../components/QuestionChoices.vue";
import QuestionContent from "../components/QuestionContent.vue";
import QuestionHints from "../components/QuestionHints.vue";
import QuestionMetaCard from "../components/QuestionMetaCard.vue";
import AnswerRevealMedia from "../components/AnswerRevealMedia.vue";
import PlayScoreboard from "../components/play/PlayScoreboard.vue";
import PlayGameResultsTable from "../components/play/PlayGameResultsTable.vue";
import Icon from "../components/Icon.vue";
import Button from "../components/Button.vue";

const route = useRoute();
const router = useRouter();
const state = ref<RoomState | null>(null);
const tourResultsTeams = computed(() =>
  state.value ? teamsSortedByScore(state.value.teams) : []
);
const isActiveQuestion = computed(
  () => state.value?.phase === "QUESTION" || state.value?.phase === "STEAL_ROUND"
);
const headerTitle = computed(() =>
  state.value ? playScreenTitle(state.value) : "Загрузка..."
);
let cleanup: (() => void) | undefined;

function syncExpiredTurn() {
  connectSocket().emit("syncExpiredTurn", () => { });
}

function loadCachedFinishedState(roomCode: string) {
  const cached = getFinishedGameSnapshot(roomCode);
  if (cached) {
    state.value = roomStateFromFinishedSnapshot(cached);
    return true;
  }
  return false;
}

async function loadRemoteFinishedState(roomCode: string) {
  try {
    state.value = await api<RoomState>(`/rooms/${roomCode}/results`);
    return true;
  } catch {
    return false;
  }
}

function endDisplay() {
  const socket = connectSocket();
  leaveRoom(() => {
    socket.disconnect();
    router.push("/");
  });
}

onMounted(() => {
  const code = route.params.code as string;
  connectSocket();

  cleanup = onRoomState((s) => {
    state.value = s;
    if (s.status === "FINISHED") {
      saveFinishedGameSnapshot(s);
    }
  });

  joinRoom({ roomCode: code, role: "display" }, (result) => {
    if (!result.ok) {
      if (loadCachedFinishedState(code)) return;
      void loadRemoteFinishedState(code);
    }
  });
});

onUnmounted(() => cleanup?.());
</script>

<template>
  <div class="display-screen">
    <div class="display-toolbar">
      <Button variant="secondary" compact @click="endDisplay">Отключиться</Button>
    </div>

    <div v-if="state?.status === 'PAUSED'" class="pause-overlay">
      <div class="pause-overlay-panel">
        <span class="pause-overlay-label">
          <Icon name="pause" :size="40" />
          ПАУЗА
        </span>
        <Button large @click="endDisplay">Отключиться</Button>
      </div>
    </div>

    <h1>{{ headerTitle }}</h1>

    <PlayScoreboard v-if="state" :teams="state.teams" :active-team-id="state.activeTeamId"
      :answer-deadline-at="state.answerDeadlineAt" :is-paused="state.status === 'PAUSED'" :show-timer="isActiveQuestion"
      :scoring-team-id="state.phase === 'CORRECT' ? state.scoringTeamId : undefined"
      :scoring-points="state.phase === 'CORRECT' ? state.questionValue : undefined" @timer-expired="syncExpiredTurn" />

    <div v-if="state?.phase === 'TOUR_RESULTS'" class="card">
      <div class="banner correct tour-results">
        <p class="tour-results-title">Итоги тура</p>
        <p v-for="team in tourResultsTeams" :key="team.id" class="tour-results-row">
          {{ team.name }} — {{ team.score }}
        </p>
      </div>
      <p class="tour-hint text-muted">Нажмите «Далее» на телефоне</p>
    </div>

    <div v-else-if="state?.phase === 'TOUR_INTRO'" class="card">
      <h2>{{ formatTourLabel(state.currentTourIndex, state.tourTitle) }}</h2>
      <p v-if="state.tourQuestionCount != null" class="tour-intro-meta">
        {{
          formatTourQuestionMeta(state.tourQuestionCount, state.limitQuestionsToTeamCount)
        }}
      </p>
      <template v-if="state.mediaUrls?.length">
        <h3 class="tour-intro-subtitle">Пример задания</h3>
        <QuestionContent large :media-urls="state.mediaUrls" />
      </template>
      <div v-if="state.tourRules" class="rich-text-preview tour-rules" v-html="state.tourRules" />
      <p class="tour-hint text-muted">Нажмите «Начать» на телефоне</p>
    </div>

    <div v-else-if="
      state &&
      (state.questionPrompt ||
        state.mediaUrls?.length ||
        (state.answerType === 'CHOICE' && state.choices?.length))
    " class="question-stack">
      <QuestionMetaCard :state="state" />
      <div class="card">
        <QuestionContent large :prompt="state.questionPrompt"
          :media-urls="isActiveQuestion ? state.mediaUrls : undefined" />
        <QuestionChoices v-if="state.answerType === 'CHOICE' && state.choices?.length" large readonly
          :choices="state.choices" />
        <QuestionHints :hints="state.hints" :hints-total="state.hintsTotal" />
        <div v-if="state.phase === 'CORRECT'" class="banner correct">
          <div class="correct-answer-text">Верно!</div>
          <span v-if="state.correctAnswer">{{ state.correctAnswer }}</span>
        </div>
        <div v-if="state.phase === 'REVEAL'" class="banner wrong">
          Правильный ответ: {{ state.correctAnswer }}
        </div>
        <div v-if="
          (state.phase === 'CORRECT' || state.phase === 'REVEAL') &&
          state.answerExplanation
        " class="answer-explanation rich-text-preview" v-html="state.answerExplanation" />
        <AnswerRevealMedia v-if="state.phase === 'CORRECT' || state.phase === 'REVEAL'" large autoplay
          :items="state.answerMedia" />
      </div>
    </div>

    <div v-if="state?.phase === 'FINISHED'" class="card">
      <div class="banner correct tour-results">
        <p class="tour-results-title">Игра окончена</p>
        <p v-for="team in tourResultsTeams" :key="team.id" class="tour-results-row">
          {{ team.name }} — {{ team.score }}
        </p>
      </div>
      <PlayGameResultsTable v-if="state.gameResults?.length" :results="state.gameResults" :teams="state.teams" />
    </div>
  </div>
</template>

<style scoped>
.display-screen {
  max-width: none;
  width: 100%;
  min-width: 0;
  padding: 24px 0;
  box-sizing: border-box;
  position: relative;
}

.display-toolbar {
  text-align: right;
  padding-bottom: 16px;
}

.display-screen>*+* {
  margin-top: 16px;
}

.display-screen h1 {
  margin: 0;
  font-size: 32px;
  line-height: 1.2;
  text-align: center;
}

.pause-overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 55%);
  z-index: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.pause-overlay-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  background: #fef3c7;
  color: #92400e;
  padding: 32px 48px;
  border-radius: 12px;
}

.pause-overlay-label {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  font-size: 40px;
  font-weight: bold;
}

@media (max-width: 1023px) {
  .display-screen h1 {
    font-size: 32px;
  }
}
</style>
