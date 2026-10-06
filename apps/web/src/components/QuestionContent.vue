<script setup lang="ts">
import { computed } from "vue";
import MediaImageRow from "./MediaImageRow.vue";

const props = defineProps<{
  prompt?: string;
  mediaUrls?: string[];
  audioUrl?: string;
  large?: boolean;
  sideBySide?: boolean;
}>();

const hasMedia = computed(() => Boolean(props.mediaUrls?.length));
const hasBody = computed(() => Boolean(props.prompt || props.audioUrl));
</script>

<template>
  <div
    class="question-content"
    :class="{
      large,
      'side-by-side': sideBySide && hasMedia && hasBody,
    }"
  >
    <div v-if="hasMedia" class="question-media">
      <MediaImageRow :media-urls="mediaUrls" :large="large" />
    </div>
    <div v-if="hasBody" class="question-body">
      <div v-if="audioUrl" class="question-audio-wrap">
        <audio class="question-audio" :src="audioUrl" controls preload="auto" />
      </div>
      <div v-if="prompt" class="question-text rich-text-preview" v-html="prompt" />
    </div>
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

.question-body > * + * {
  margin-top: 16px;
}

.question-audio-wrap {
  text-align: center;
  margin-bottom: 12px;
}

.question-body > .question-audio-wrap + * {
  margin-top: 0;
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

.question-body > .question-text:first-child {
  padding-top: 0;
}

.large .question-text {
  font-size: 16px;
  font-weight: bold;
}

@media (min-width: 769px) {
  .side-by-side::after {
    content: '';
    display: table;
    clear: both;
  }

  .side-by-side > * + * {
    margin-top: 0;
  }

  .side-by-side .question-media {
    float: left;
    margin-right: 12px;
  }

  .side-by-side .question-body {
    display: block;
    overflow: hidden;
  }

  .side-by-side .question-text {
    padding-top: 0;
  }

  .side-by-side :deep(.media-row) {
    text-align: left;
    margin-left: 0;
    margin-right: 0;
  }

  .side-by-side :deep(.media-image-container) {
    height: 220px;
    margin-top: 0;
    margin-left: 0;
    margin-right: 8px;
  }
}

@media (max-width: 1023px) {
  .large .question-text {
    font-size: 16px;
  }
}
</style>
