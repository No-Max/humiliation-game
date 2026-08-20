<script setup lang="ts">
import { computed } from 'vue';
import type { AnswerMediaItem } from '@humiliation-game/shared';
import MediaImageRow from './MediaImageRow.vue';

const props = defineProps<{
  items?: AnswerMediaItem[];
  large?: boolean;
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

function imageUrls(group: MediaGroup): string[] {
  return group.entries.map((entry) => entry.item.url);
}
</script>

<template>
  <div v-if="items?.length" class="answer-reveal-media">
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
            preload="metadata"
          />
          <video
            v-else
            class="answer-video"
            :src="item.url"
            controls
            preload="metadata"
            playsinline
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.answer-reveal-media {
  margin: 0.75rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.answer-reveal-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: stretch;
  gap: 0.75rem;
  width: 100%;
  align-self: stretch;
}

.answer-reveal-item {
  flex: 0 1 min(100%, 420px);
  width: min(100%, 420px);
  min-width: min(100%, 300px);
  max-width: 100%;
  box-sizing: border-box;
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
