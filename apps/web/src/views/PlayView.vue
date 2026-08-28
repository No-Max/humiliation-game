<script setup lang="ts">
import { computed } from 'vue';
import { playScreenTitle } from '@humiliation-game/shared';
import { usePlayRoom } from '../composables/usePlayRoom';
import PlayAnswerResultCard from '../components/play/PlayAnswerResultCard.vue';
import PlayConnectionModal from '../components/play/PlayConnectionModal.vue';
import PlayExitModal from '../components/play/PlayExitModal.vue';
import PlayGameOverCard from '../components/play/PlayGameOverCard.vue';
import PlayOfflineTeamNotice from '../components/play/PlayOfflineTeamNotice.vue';
import PlayQuestionCard from '../components/play/PlayQuestionCard.vue';
import PlayRoomStatus from '../components/play/PlayRoomStatus.vue';
import PlayScoreboard from '../components/play/PlayScoreboard.vue';
import PlayTourIntroCard from '../components/play/PlayTourIntroCard.vue';
import PlayTourResultsCard from '../components/play/PlayTourResultsCard.vue';
import PlayViewHeader from '../components/play/PlayViewHeader.vue';
import QuestionMetaCard from '../components/QuestionMetaCard.vue';

const {
  state,
  answer,
  message,
  teamId,
  teamName,
  socketConnected,
  joined,
  showConnectionModal,
  showExitModal,
  code,
  linksActive,
  isPaused,
  isMyTurn,
  myTeam,
  isChoiceQuestion,
  tourResultsTeams,
  canSubmit,
  isActiveQuestion,
  canAdvanceQuestion,
  offlineActiveTeam,
  startTour,
  continueToTourIntro,
  submitChoice,
  submit,
  pass,
  skipTurn,
  syncExpiredTurn,
  nextQuestion,
  adjustQuestionResult,
  reconnect,
  onTeamRenamed,
  openConnection,
  closeConnection,
  pauseGame,
  resumeGame,
  openExit,
  closeExit,
  confirmExit,
} = usePlayRoom();

const showQuestionCard = computed(
  () =>
    state.value &&
    (state.value.questionPrompt ||
      state.value.mediaUrls?.length ||
      (state.value.answerType === 'CHOICE' && state.value.choices?.length)) &&
    isActiveQuestion.value,
);

const headerTitle = computed(() =>
  state.value ? playScreenTitle(state.value) : 'Игра',
);
</script>

<template>
  <div>
    <PlayViewHeader
      :series-title="headerTitle"
      :links-active="linksActive"
      :joined="joined"
      :is-paused="isPaused"
      @pause="pauseGame"
      @resume="resumeGame"
      @exit="openExit"
      @open-connection="openConnection"
    />

    <PlayRoomStatus
      :code="code"
      :is-paused="isPaused"
      :paused-by="state?.pausedBy"
      :socket-connected="socketConnected"
      :status="state?.status"
      :team-id="teamId"
      :joined="joined"
      :links-active="linksActive"
      @reconnect="reconnect"
    />

    <PlayScoreboard
      v-if="state"
      :teams="state.teams"
      :active-team-id="state.activeTeamId"
      :answer-deadline-at="state.answerDeadlineAt"
      :is-paused="isPaused"
      :show-timer="isActiveQuestion"
      :scoring-team-id="state.phase === 'CORRECT' ? state.scoringTeamId : undefined"
      :scoring-points="state.phase === 'CORRECT' ? state.questionValue : undefined"
      @timer-expired="syncExpiredTurn"
    />

    <PlayOfflineTeamNotice
      v-if="offlineActiveTeam"
      :team="offlineActiveTeam"
      @open-connection="openConnection"
    />

    <div v-if="isActiveQuestion && state" class="question-stack">
      <QuestionMetaCard
        :state="state"
        :is-my-turn="!!isMyTurn"
        :my-team-connected="myTeam?.connected !== false"
      />
      <PlayQuestionCard
        v-if="showQuestionCard"
        v-model:answer="answer"
        :state="state"
        :is-paused="isPaused"
        :is-my-turn="!!isMyTurn"
        :my-team="myTeam"
        :is-choice-question="isChoiceQuestion"
        :can-submit="canSubmit"
        @submit-choice="submitChoice"
        @submit="submit"
        @pass="pass"
        @skip-turn="skipTurn"
      />
    </div>

    <PlayConnectionModal
      v-if="showConnectionModal && linksActive"
      v-model:team-name="teamName"
      :room-code="code"
      :team-id="teamId"
      :state="state"
      @close="closeConnection"
      @team-renamed="onTeamRenamed"
    />

    <PlayTourResultsCard
      v-if="state?.phase === 'TOUR_RESULTS' && !isPaused"
      :teams="tourResultsTeams"
      @continue-to-tour-intro="continueToTourIntro"
    />

    <PlayTourIntroCard
      v-else-if="state?.phase === 'TOUR_INTRO' && !isPaused"
      :state="state"
      @start-tour="startTour"
    />

    <PlayAnswerResultCard
      v-else-if="state?.phase === 'CORRECT' && !isPaused"
      phase="CORRECT"
      :question-value="state.questionValue"
      :question-prompt="state.questionPrompt"
      :correct-answer="state.correctAnswer"
      :answer-explanation="state.answerExplanation"
      :answer-media="state.answerMedia"
      :teams="state.teams"
      :scoring-team-id="state.scoringTeamId"
      :show-next-question="canAdvanceQuestion"
      @next-question="nextQuestion"
      @adjust-result="adjustQuestionResult"
    />

    <PlayAnswerResultCard
      v-else-if="state?.phase === 'REVEAL' && !isPaused"
      phase="REVEAL"
      :question-value="state.questionValue"
      :question-prompt="state.questionPrompt"
      :correct-answer="state.correctAnswer"
      :answer-explanation="state.answerExplanation"
      :answer-media="state.answerMedia"
      :teams="state.teams"
      :scoring-team-id="state.scoringTeamId"
      :show-next-question="canAdvanceQuestion"
      @next-question="nextQuestion"
      @adjust-result="adjustQuestionResult"
    />

    <PlayGameOverCard
      v-else-if="state?.phase === 'FINISHED'"
      :teams="tourResultsTeams"
      :table-teams="state.teams"
      :game-results="state.gameResults"
      @finish="confirmExit"
    />

    <PlayExitModal
      v-if="showExitModal"
      @close="closeExit"
      @confirm="confirmExit"
    />

    <p v-if="message" class="play-message text-error">
      {{ message }}
    </p>
  </div>
</template>

<style scoped>
.play-message {
  margin-top: 16px;
}
</style>
