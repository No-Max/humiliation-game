<script setup lang="ts">
import { computed } from 'vue';
import type { GameQuestionResult, TeamState } from '@humiliation-game/shared';
import { formatTourLabel } from '@humiliation-game/shared';

const props = defineProps<{
  results: GameQuestionResult[];
  teams: TeamState[];
}>();

interface TourGroup {
  tourIndex: number;
  tourTitle: string;
  results: GameQuestionResult[];
}

const tourGroups = computed((): TourGroup[] => {
  const sorted = [...props.results].sort(
    (a, b) => a.tourIndex - b.tourIndex || a.questionIndex - b.questionIndex,
  );

  const groups: TourGroup[] = [];
  for (const result of sorted) {
    const last = groups[groups.length - 1];
    if (!last || last.tourIndex !== result.tourIndex) {
      groups.push({
        tourIndex: result.tourIndex,
        tourTitle: formatTourLabel(result.tourIndex, result.tourTitle),
        results: [result],
      });
      continue;
    }
    last.results.push(result);
  }

  return groups;
});

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
        <template v-for="(group, groupIndex) in tourGroups" :key="group.tourIndex">
          <tr class="game-results-tour-row">
            <td :colspan="teams.length + 1">{{ group.tourTitle }}</td>
          </tr>
          <tr
            v-for="(result, index) in group.results"
            :key="`${result.tourIndex}-${result.questionIndex}-${index}`"
            :class="{ 'game-results-last-row': groupIndex === tourGroups.length - 1 && index === group.results.length - 1 }"
          >
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
        </template>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.game-results-table-wrap {
  margin-top: 16px;
  overflow-x: auto;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  -webkit-overflow-scrolling: touch;
}

.game-results-table {
  width: 100%;
  min-width: 700px;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
}

.game-results-table th,
.game-results-table td {
  border-right: 1px solid #d1d5db;
  border-bottom: 1px solid #d1d5db;
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
}

.game-results-table th:last-child,
.game-results-table td:last-child {
  border-right: none;
}

.game-results-table tbody tr.game-results-last-row td {
  border-bottom: none;
}

.game-results-table thead tr:first-child th:first-child {
  border-top-left-radius: 8px;
}

.game-results-table thead tr:first-child th:last-child {
  border-top-right-radius: 8px;
}

.game-results-table tbody tr.game-results-last-row td:first-child {
  border-bottom-left-radius: 8px;
}

.game-results-table tbody tr.game-results-last-row td:last-child {
  border-bottom-right-radius: 8px;
}

.game-results-table th {
  background: #f3f4f6;
  font-weight: 600;
}

.game-results-tour-row td {
  background: #eef2ff;
  color: #3730a3;
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
