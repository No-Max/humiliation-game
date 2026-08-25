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
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.question-content > * + * {
  margin-top: 16px;
}

.question-text {
  font-size: 18px;
  margin: 0;
  text-align: center;
  padding-top: 16px;
}

.large .question-text {
  font-size: 40px;
  font-weight: bold;
}

@media (max-width: 1023px) {
  .large .question-text {
    font-size: 24px;
  }
}
</style>
