<script setup lang="ts">
defineProps<{
  mediaUrls?: string[];
  large?: boolean;
}>();
</script>

<template>
  <div v-if="mediaUrls?.length" class="media-row-measure" :class="{ large }">
    <div class="media-row">
      <div
        v-for="(url, index) in mediaUrls"
        :key="`${url}-${index}`"
        class="media-image-container"
      >
        <img :src="url" alt="" class="media-image" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.media-row-measure {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.media-row {
  display: block;
  text-align: center;
  box-sizing: border-box;
  margin-right: -8px;
  margin-left: -8px;
}

.media-image-container {
  display: inline-block;
  height: 250px;
  margin: 16px 8px 0 8px;
  vertical-align: top;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
}

.media-image {
  height: 100%;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .media-image-container {
    height: 150px;
  }
}
</style>
