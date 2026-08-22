<script setup lang="ts">
import type { RoomState, TeamState } from '@humiliation-game/shared';
import { formatTourLabel, formatTourQuestionMeta } from '@humiliation-game/shared';
import QuestionContent from '../QuestionContent.vue';
import Button from '../Button.vue';

defineProps<{
  state: RoomState;
  showTourResults: boolean;
  tourResultsTeams: TeamState[];
}>();

defineEmits<{
  startTour: [];
}>();
</script>

<template>
  <div class="card">
    <h2 class="tour-intro-title">
      {{ formatTourLabel(state.currentTourIndex, state.tourTitle) }}
    </h2>
    <p v-if="state.tourQuestionCount != null" class="tour-intro-meta">
      {{ formatTourQuestionMeta(state.tourQuestionCount, state.limitQuestionsToTeamCount) }}
    </p>
    <div v-if="showTourResults" class="banner correct tour-results">
      <p class="tour-results-title">Итоги тура</p>
      <p v-for="team in tourResultsTeams" :key="team.id" class="tour-results-row">
        {{ team.name }} — {{ team.score }}
      </p>
    </div>
    <template v-if="state.mediaUrls?.length">
      <h3 class="tour-intro-subtitle">Пример задания</h3>
      <QuestionContent :media-urls="state.mediaUrls" />
    </template>
    <div
      v-if="state.tourRules"
      class="rich-text-preview tour-rules"
      v-html="state.tourRules"
    />
    <Button @click="$emit('startTour')">Начать тур</Button>
  </div>
</template>

<style scoped>
.tour-intro-title {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  line-height: 1.35;
  text-align: center;
}

.tour-intro-meta {
  color: #6b7280;
  font-size: 15px;
  margin: 0;
  text-align: center;
}

.tour-intro-subtitle {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  line-height: 1.35;
  text-align: left;
}

.tour-rules {
  margin: 0;
  text-align: left;
}

.tour-results {
  margin: 0;
  display: block;
}

.tour-results > * + * {
  margin-top: 16px;
}

.tour-results-title {
  font-size: 18px;
  margin: 0;
}

.tour-results-row {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
}
</style>
