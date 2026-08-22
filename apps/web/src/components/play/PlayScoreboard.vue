<script setup lang="ts">
import { formatPoints, type TeamState } from '@humiliation-game/shared';
import AnswerTimer from '../AnswerTimer.vue';

defineProps<{
  teams: TeamState[];
  activeTeamId?: string;
  answerDeadlineAt?: number;
  isPaused?: boolean;
  showTimer?: boolean;
  scoringTeamId?: string;
  scoringPoints?: number;
}>();

const emit = defineEmits<{
  'timer-expired': [];
}>();
</script>

<template>
  <div class="scoreboard">
    <div
      v-for="team in teams"
      :key="team.id"
      class="team-score"
      :class="{
        active: team.id === activeTeamId,
        scored: team.id === scoringTeamId,
      }"
    >
      <div class="team-score-name-row">
        <div v-if="team.id === scoringTeamId && scoringPoints != null" class="team-score-award">
          {{ team.name }} +{{ formatPoints(scoringPoints) }}
        </div>
        <div v-else>{{ team.name }}</div>
        <AnswerTimer
          v-if="showTimer && team.id === activeTeamId && !isPaused"
          :deadline-at="answerDeadlineAt"
          :paused="isPaused"
          @expired="emit('timer-expired')"
        />
      </div>
      <small v-if="!team.connected" class="team-score-status team-score-status--offline">offline</small>
      <small
        v-if="showTimer && team.id === activeTeamId"
        class="team-score-status"
      >отвечает</small>
      <small v-if="team.passed" class="team-score-status">сдалась</small>
    </div>
  </div>
</template>

<style scoped>
.team-score-name-row {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.team-score-name-row > * + * {
  margin-left: 8px;
}

.team-score-name-row :deep(.answer-timer) {
  font-size: 16px;
}

.team-score.scored {
  outline: 2px solid #059669;
  background: #ecfdf5;
}

.team-score-award {
  font-weight: 700;
  color: #065f46;
}

.team-score-status {
  display: block;
  font-size: 14px;
  color: #9ca3af;
}

.team-score-status--offline {
  color: #ef4444;
}
</style>
