<script setup lang="ts">
import { computed } from 'vue';
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
import PlayViewHeader from '../components/play/PlayViewHeader.vue';

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
  showTourResults,
  tourResultsTeams,
  canSubmit,
  isActiveQuestion,
  offlineActiveTeam,
  startTour,
  submitChoice,
  submit,
  pass,
  nextQuestion,
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
</script>

<template>
  <div>
    <PlayViewHeader
      :series-title="state?.seriesTitle ?? 'Игра'"
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
    />

    <PlayOfflineTeamNotice
      v-if="offlineActiveTeam"
      :team="offlineActiveTeam"
      @open-connection="openConnection"
    />

    <PlayQuestionCard
      v-if="showQuestionCard && state"
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
    />

    <PlayConnectionModal
      v-if="showConnectionModal && linksActive"
      v-model:team-name="teamName"
      :room-code="code"
      :team-id="teamId"
      :state="state"
      @close="closeConnection"
      @team-renamed="onTeamRenamed"
    />

    <PlayTourIntroCard
      v-if="state?.phase === 'TOUR_INTRO' && !isPaused"
      :state="state"
      :show-tour-results="showTourResults"
      :tour-results-teams="tourResultsTeams"
      @start-tour="startTour"
    />

    <PlayAnswerResultCard
      v-else-if="state?.phase === 'CORRECT' && !isPaused"
      phase="CORRECT"
      :question-value="state.questionValue"
      :correct-answer="state.correctAnswer"
      @next-question="nextQuestion"
    />

    <PlayAnswerResultCard
      v-else-if="state?.phase === 'REVEAL' && !isPaused"
      phase="REVEAL"
      :question-value="state.questionValue"
      :correct-answer="state.correctAnswer"
      @next-question="nextQuestion"
    />

    <PlayGameOverCard
      v-else-if="state?.phase === 'FINISHED'"
      :teams="tourResultsTeams"
    />

    <PlayExitModal
      v-if="showExitModal"
      @close="closeExit"
      @confirm="confirmExit"
    />

    <p v-if="message" style="color: #dc2626; margin-top: 1rem">
      {{ message }}
    </p>
  </div>
</template>
