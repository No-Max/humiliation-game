<script setup lang="ts">
import type { RoomState } from '@humiliation-game/shared';
import { formatTourLabel, formatTourQuestionMeta } from '@humiliation-game/shared';
import QuestionContent from '../QuestionContent.vue';
import Button from '../Button.vue';

defineProps<{
  state: RoomState;
}>();

defineEmits<{
  startTour: [];
}>();
</script>

<template>
  <div class="card tour-intro-card">
    <h2 class="tour-intro-title">
      {{ formatTourLabel(state.currentTourIndex, state.tourTitle) }}
    </h2>
    <p v-if="state.tourQuestionCount != null" class="tour-intro-meta">
      {{ formatTourQuestionMeta(state.tourQuestionCount, state.limitQuestionsToTeamCount) }}
    </p>
    <template v-if="state.mediaUrls?.length">
      <h3 class="tour-intro-subtitle">Правила и пример задания тура:</h3>
      <QuestionContent :media-urls="state.mediaUrls" />
    </template>
    <div
      v-if="state.tourRules"
      class="rich-text-preview tour-rules"
      v-html="state.tourRules"
    />
    <Button class="tour-intro-btn" @click="$emit('startTour')">Начать тур</Button>
  </div>
</template>

<style scoped>
.tour-intro-card {
  margin-top: 16px;
}

.tour-intro-title {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  line-height: 1.35;
  text-align: center;
}

.tour-intro-meta {
  margin-top: 4px;
}

.tour-intro-subtitle {
  margin-top: 4px;
}

.tour-intro-btn {
  margin-top: 16px;
}
</style>
