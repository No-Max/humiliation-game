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
  text-align: center;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.media-image-container {
  display: inline-block;
  height: 300px;
  max-width: calc(50% - 16px);
  margin: 8px;
  vertical-align: top;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
  box-sizing: border-box;
  overflow: hidden;
}

.media-image {
  display: block;
  height: 300px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  box-sizing: border-box;
}
</style>
