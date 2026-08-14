<script setup lang="ts">
import type { RoomState, TeamState } from '@humiliation-game/shared';
import { formatQuestionCount, formatTourLabel } from '@humiliation-game/shared';
import QuestionContent from '../QuestionContent.vue';

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
      {{ formatQuestionCount(state.tourQuestionCount) }}
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
    <button class="btn" @click="$emit('startTour')">Начать тур</button>
  </div>
</template>
