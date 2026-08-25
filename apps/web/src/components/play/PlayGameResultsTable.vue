<script setup lang="ts">
import { computed } from 'vue';
import type { GameQuestionResult, TeamState } from '@humiliation-game/shared';

const props = defineProps<{
  results: GameQuestionResult[];
  teams: TeamState[];
}>();

const rows = computed(() =>
  [...props.results].sort(
    (a, b) => a.tourIndex - b.tourIndex || a.questionIndex - b.questionIndex,
  ),
);

function teamPoints(result: GameQuestionResult, teamId: string): string {
  if (result.scoringTeamId !== teamId) return '—';
  return String(result.points);
}
</script>

<template>
  <div class="game-results-table-wrap">
    <table class="game-results-table">
      <thead>
        <tr>
          <th>Вопрос</th>
          <th v-for="team in teams" :key="team.id">{{ team.name }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(result, index) in rows" :key="`${result.tourIndex}-${result.questionIndex}-${index}`">
          <td class="game-results-answer">{{ result.correctAnswer }}</td>
          <td
            v-for="team in teams"
            :key="team.id"
            class="game-results-points"
            :class="{ scored: result.scoringTeamId === team.id }"
          >
            {{ teamPoints(result, team.id) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.game-results-table-wrap {
  margin-top: 16px;
  overflow-x: auto;
}

.game-results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  border-radius: 8px;
}

.game-results-table th,
.game-results-table td {
  border: 1px solid #d1d5db;
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
}

.game-results-table th {
  background: #f3f4f6;
  font-weight: 600;
}

.game-results-answer {
  min-width: 120px;
  max-width: 280px;
}

.game-results-points {
  text-align: center;
  white-space: nowrap;
  color: #9ca3af;
}

.game-results-points.scored {
  color: #065f46;
  font-weight: bold;
}
</style>
