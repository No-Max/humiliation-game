<script setup lang="ts">
defineProps<{
  prompt?: string;
  mediaUrls?: string[];
  large?: boolean;
}>();
</script>

<template>
  <div class="question-content" :class="{ large }">
    <div v-if="mediaUrls?.length" class="media-row">
      <img
        v-for="(url, index) in mediaUrls"
        :key="`${url}-${index}`"
        :src="url"
        alt=""
        class="media-image"
      />
    </div>
    <p v-if="prompt" class="question-text">{{ prompt }}</p>
  </div>
</template>

<style scoped>
.question-content {
  display: grid;
  gap: 1rem;
}

.media-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.75rem;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.media-image {
  flex: 1 1 0;
  min-width: 0;
  max-height: 220px;
  width: 100%;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  background: #f3f4f6;
}

.large .media-image {
  max-height: 360px;
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
