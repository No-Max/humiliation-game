<script setup lang="ts">
import type { TeamState } from '@humiliation-game/shared';
import AnswerTimer from '../AnswerTimer.vue';

defineProps<{
  teams: TeamState[];
  activeTeamId?: string;
  answerDeadlineAt?: number;
  isPaused?: boolean;
  showTimer?: boolean;
}>();
</script>

<template>
  <div class="scoreboard">
    <div
      v-for="team in teams"
      :key="team.id"
      class="team-score"
      :class="{ active: team.id === activeTeamId }"
    >
      <div class="team-score-name-row">
        <div>{{ team.name }}</div>
        <AnswerTimer
          v-if="showTimer && team.id === activeTeamId && !isPaused"
          :deadline-at="answerDeadlineAt"
          :paused="isPaused"
        />
      </div>
      <small v-if="!team.connected" style="color: #ef4444; display: block">offline</small>
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
</style>
