<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import type { AnswerMediaItem } from '@humiliation-game/shared';
import MediaImageRow from './MediaImageRow.vue';

const props = defineProps<{
  items?: AnswerMediaItem[];
  large?: boolean;
  autoplay?: boolean;
}>();

interface MediaEntry {
  item: AnswerMediaItem;
  index: number;
}

interface MediaGroup {
  type: AnswerMediaItem['type'];
  entries: MediaEntry[];
}

const groups = computed<MediaGroup[]>(() => {
  const result: MediaGroup[] = [];
  for (let index = 0; index < (props.items?.length ?? 0); index++) {
    const item = props.items![index];
    const last = result[result.length - 1];
    if (last?.type === item.type) {
      last.entries.push({ item, index });
    } else {
      result.push({ type: item.type, entries: [{ item, index }] });
    }
  }
  return result;
});

const rootEl = ref<HTMLElement | null>(null);

function imageUrls(group: MediaGroup): string[] {
  return group.entries.map((entry) => entry.item.url);
}

function stopAllMedia() {
  const root = rootEl.value;
  if (!root) return;
  for (const el of root.querySelectorAll('audio, video')) {
    const media = el as HTMLMediaElement;
    media.pause();
    media.currentTime = 0;
  }
}

async function playFirstMedia() {
  if (!props.autoplay) return;
  await nextTick();
  const root = rootEl.value;
  if (!root) return;

  const media = root.querySelector('audio, video') as HTMLMediaElement | null;
  if (!media) return;

  try {
    media.currentTime = 0;
    await media.play();
  } catch {
    // Autoplay may be blocked by the browser; controls stay available.
  }
}

watch(
  () => [props.autoplay, props.items] as const,
  () => {
    stopAllMedia();
    void playFirstMedia();
  },
  { deep: true, immediate: true },
);

onBeforeUnmount(() => {
  stopAllMedia();
});
</script>

<template>
  <div v-if="items?.length" ref="rootEl" class="answer-reveal-media">
    <template v-for="(group, groupIndex) in groups" :key="`${group.type}-${groupIndex}`">
      <MediaImageRow
        v-if="group.type === 'IMAGE'"
        :media-urls="imageUrls(group)"
        :large="large"
      />

      <div
        v-else
        class="answer-reveal-group"
        :class="[
          `answer-reveal-group--${group.type.toLowerCase()}`,
          { 'answer-reveal-group--multi': group.entries.length > 1 },
        ]"
      >
        <div
          v-for="{ item, index } in group.entries"
          :key="`${item.url}-${index}`"
          class="answer-reveal-item"
        >
          <audio
            v-if="item.type === 'AUDIO'"
            class="answer-audio"
            :src="item.url"
            controls
            preload="auto"
            :autoplay="autoplay"
          />
          <video
            v-else
            class="answer-video"
            :src="item.url"
            controls
            preload="auto"
            playsinline
            :autoplay="autoplay"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.answer-reveal-media {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.answer-reveal-media > * + * {
  margin-top: 12px;
}

.answer-reveal-group {
  display: block;
  text-align: center;
  font-size: 0;
  width: 100%;
  margin: 0;
  padding-top: 16px;
}

.answer-reveal-item {
  display: inline-block;
  vertical-align: top;
  width: 300px;
  max-width: 100%;
  min-width: 0;
  margin: 0;
  box-sizing: border-box;
  font-size: 16px;
}

.answer-audio,
.answer-video {
  display: block;
  width: 100%;
  margin: 0;
}

.answer-video {
  max-height: 360px;
  object-fit: contain;
  border-radius: 8px;
  background: #111827;
}

.answer-reveal-group--multi .answer-video {
  max-height: 220px;
}
</style>
