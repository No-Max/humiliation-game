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
      <small v-if="!team.connected" style="color: #ef4444; display: block">offline</small>
      <small
        v-if="showTimer && team.id === activeTeamId"
        style="color: #9ca3af; display: block"
      >отвечает</small>
      <small v-if="team.passed" style="color: #9ca3af; display: block">сдалась</small>
    </div>
  </div>
</template>

<style scoped>
.team-score-name-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.team-score-name-row :deep(.answer-timer) {
  font-size: 1rem;
}

.team-score.scored {
  outline: 2px solid #059669;
  background: #ecfdf5;
}

.team-score-award {
  font-weight: 700;
  color: #065f46;
}
</style>
