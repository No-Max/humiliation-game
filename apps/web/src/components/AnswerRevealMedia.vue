<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import type { AnswerMediaItem, AnswerMediaType } from '@humiliation-game/shared';

const props = defineProps<{
  items?: AnswerMediaItem[];
}>();

const playingIndex = ref<number | null>(null);
const audioRefs = ref<Record<number, HTMLAudioElement | null>>({});
const videoRefs = ref<Record<number, HTMLVideoElement | null>>({});

watch(
  () => props.items,
  () => {
    playingIndex.value = null;
  },
  { deep: true },
);

function setAudioRef(index: number, el: unknown) {
  audioRefs.value[index] = el instanceof HTMLAudioElement ? el : null;
}

function setVideoRef(index: number, el: unknown) {
  videoRefs.value[index] = el instanceof HTMLVideoElement ? el : null;
}

async function startPlayback(index: number, type: AnswerMediaType) {
  playingIndex.value = index;
  await nextTick();
  const el = type === 'AUDIO' ? audioRefs.value[index] : videoRefs.value[index];
  try {
    await el?.play();
  } catch {
    // Autoplay may still be blocked; controls remain available.
  }
}

function playLabel(type: AnswerMediaType) {
  return type === 'AUDIO' ? 'Слушать' : 'Смотреть';
}
</script>

<template>
  <div v-if="items?.length" class="answer-reveal-media">
    <div
      v-for="(item, index) in items"
      :key="`${item.url}-${index}`"
      class="answer-reveal-item"
    >
      <img
        v-if="item.type === 'IMAGE'"
        :src="item.url"
        alt=""
        class="answer-image"
      />

      <template v-else-if="item.type === 'AUDIO' || item.type === 'VIDEO'">
        <button
          v-if="playingIndex !== index"
          class="btn btn-secondary"
          type="button"
          @click="startPlayback(index, item.type)"
        >
          {{ playLabel(item.type) }}
        </button>
        <audio
          v-else-if="item.type === 'AUDIO'"
          :ref="(el) => setAudioRef(index, el)"
          class="answer-audio"
          :src="item.url"
          controls
        />
        <video
          v-else
          :ref="(el) => setVideoRef(index, el)"
          class="answer-video"
          :src="item.url"
          controls
          playsinline
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.answer-reveal-media {
  margin: 0.75rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.answer-image {
  display: block;
  max-width: 100%;
  max-height: 280px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
}

.answer-audio {
  display: block;
  width: 100%;
  max-width: 420px;
}

.answer-video {
  display: block;
  width: 100%;
  max-width: 560px;
  max-height: 360px;
  border-radius: 8px;
  background: #111;
}
</style>
