<script setup lang="ts">
import MediaImageRow from './MediaImageRow.vue';

defineProps<{
  prompt?: string;
  mediaUrls?: string[];
  large?: boolean;
}>();
</script>

<template>
  <div class="question-content" :class="{ large }">
    <MediaImageRow :media-urls="mediaUrls" :large="large" />
    <div
      v-if="prompt"
      class="question-text rich-text-preview"
      v-html="prompt"
    />
  </div>
</template>

<style scoped>
.question-content {
  display: grid;
  gap: 16px;
}

.question-text {
  font-size: 1.125rem;
  margin: 0;
  text-align: center;
}

.large .question-text {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 600;
}
</style>
