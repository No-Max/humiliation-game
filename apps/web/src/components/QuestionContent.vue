<script setup lang="ts">
import MediaImageRow from "./MediaImageRow.vue";

defineProps<{
  prompt?: string;
  mediaUrls?: string[];
  audioUrl?: string;
  large?: boolean;
}>();
</script>

<template>
  <div class="question-content" :class="{ large }">
    <MediaImageRow :media-urls="mediaUrls" :large="large" />
    <div v-if="audioUrl" class="question-audio-wrap">
      <audio class="question-audio" :src="audioUrl" controls preload="auto" />
    </div>
    <div v-if="prompt" class="question-text rich-text-preview" v-html="prompt" />
  </div>
</template>

<style scoped>
.question-content {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.question-content>*+* {
  margin-top: 16px;
}

.question-audio-wrap {
  text-align: center;
}

.question-audio {
  display: block;
  width: min(100%, 420px);
  margin: 0 auto;
}

.question-text {
  font-size: 16px;
  line-height: 18px;
  margin: 0;
  padding-top: 16px;
}

.large .question-text {
  font-size: 16px;
  font-weight: bold;
}

@media (max-width: 1023px) {
  .large .question-text {
    font-size: 16px;
  }
}
</style>
