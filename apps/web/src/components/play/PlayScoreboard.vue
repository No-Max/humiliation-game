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
.scoreboard {
  display: block;
  text-align: center;
  font-size: 0;
  margin: -8px -8px 16px;
  min-width: 0;
}

.team-score {
  display: inline-block;
  vertical-align: top;
  width: 160px;
  min-width: 160px;
  max-width: calc(50% - 16px);
  margin: 8px;
  padding: 8px;
  border-radius: 8px;
  background: #f3f4f6;
  text-align: center;
  box-sizing: border-box;
  font-size: 16px;
}

.team-score > * + * {
  margin-top: 6px;
}

.team-score.active {
  outline: 3px solid #4f46e5;
}

@media (max-width: 1023px) {
  .team-score {
    width: 120px;
    min-width: 120px;
  }
}

.team-score-name-row {
  text-align: center;
  font-size: 0;
}

.team-score-name-row > * {
  display: inline-block;
  vertical-align: middle;
  font-size: 16px;
  margin-left: 8px;
}

.team-score-name-row > *:first-child {
  margin-left: 0;
}

.team-score-name-row :deep(.answer-timer) {
  font-size: 16px;
}

.team-score.scored {
  outline: 2px solid #059669;
  background: #ecfdf5;
}

.team-score-award {
  font-weight: bold;
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
