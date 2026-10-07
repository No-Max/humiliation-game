<script setup lang="ts">
import type { TeamState } from '@humiliation-game/shared';
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

      :style="{ width: `${Math.round(100 / teams.length)}%` }"
    >
      <div class="team-score-card" :class="{ 'team-score-card--logo': !!team.logoUrl }">
        <img
          v-if="team.logoUrl"
          :src="team.logoUrl"
          alt=""
          class="team-score-logo"
          width="40"
          height="40"
        />
        <div class="team-score-body">
          <div class="team-score-name-row">
            <div v-if="team.id === scoringTeamId && scoringPoints != null" class="team-score-award">
              {{ team.name }} +{{ scoringPoints }}
            </div>
            <div v-else>{{ team.name }}</div>
          </div>
          <div class="team-score-status-row">
            <small v-if="!team.connected" class="team-score-status team-score-status--offline">offline</small>
            <small v-else-if="team.passed" class="team-score-status">сдалась</small>
            <AnswerTimer
              v-if="showTimer && team.id === activeTeamId && !isPaused"
              :deadline-at="answerDeadlineAt"
              :paused="isPaused"
              @expired="emit('timer-expired')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scoreboard {
  display: block;
  text-align: center;
  line-height: 0;
  font-size: 0;
  margin-left: -8px;
  margin-right: -8px;
}

.team-score {
  display: inline-block;
  vertical-align: top;
  box-sizing: border-box;
  padding: 16px 8px 0 8px;
  min-width: 180px;
  height: 72px;
}

.team-score-card {
  width: 100%;
  height: 100%;
  vertical-align: top;
  padding: 8px;
  outline: 2px solid #ccc;
  box-sizing: border-box;
  border-radius: 0;
  font-size: 0;
}

.team-score-card--logo {
  text-align: left;
}

.team-score-logo {
  display: inline-block;
  vertical-align: middle;
  width: 40px;
  height: 40px;
  object-fit: cover;
  margin-right: 8px;
  background: #f3f4f6;
}

.team-score-body {
  display: inline-block;
  vertical-align: middle;
  max-width: calc(100% - 48px);
  font-size: 14px;
}

.team-score-card:not(.team-score-card--logo) .team-score-body {
  display: block;
  max-width: none;
}

.active .team-score-card  {
  outline: 3px solid var(--color-accent);
}

.team-score-name-row {
  text-align: center;
  font-size: 14px;
  font-weight: bold;
  line-height: 20px;
  height: 20px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team-score-card--logo .team-score-name-row,
.team-score-card--logo .team-score-status-row {
  text-align: left;
}

.team-score-card.scored {
  outline: 2px solid #059669;
  background: #ecfdf5;
}

.team-score-award {
  font-weight: bold;
  color: #065f46;
  font-size: 16px;
  line-height: 20px;
  height: 20px;
}

.team-score-status {
  display: inline-block;
  margin-right: 4px;
  font-size: 14px;
  line-height: 20px;
  height: 20px;
  color: #9ca3af;
}

.team-score-status--offline {
  color: #ef4444;
}

.team-score-status-row {
  line-height: 0;
}
</style>
