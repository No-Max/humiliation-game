<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  allMediaCached,
  mediaUrlsKey,
  setCachedMediaRatio,
  syncMediaLayoutState,
} from '../lib/mediaLayoutCache';

const GAP_PX = 16;
const MAX_ROW_HEIGHT_PX = 400;

const props = defineProps<{
  prompt?: string;
  mediaUrls?: string[];
  large?: boolean;
}>();

const rowRef = ref<HTMLElement | null>(null);
const rowWidth = ref(0);
const aspectRatios = ref<number[]>([]);
const loaded = ref<boolean[]>([]);
const stableRowHeightPx = ref<number | null>(null);

let resizeObserver: ResizeObserver | undefined;
let resizeRaf = 0;

function syncFromUrls(urls: string[] | undefined) {
  const next = syncMediaLayoutState(urls);
  aspectRatios.value = next.aspectRatios;
  loaded.value = next.loaded;
}

watch(
  () => mediaUrlsKey(props.mediaUrls),
  () => {
    stableRowHeightPx.value = null;
    syncFromUrls(props.mediaUrls);
  },
  { immediate: true },
);

const allLoaded = computed(
  () =>
    (props.mediaUrls?.length ?? 0) > 0
    && loaded.value.length === props.mediaUrls!.length
    && loaded.value.every(Boolean),
);

const sumAspectRatios = computed(() =>
  aspectRatios.value.reduce((sum, ratio) => sum + ratio, 0),
);

const gapTotal = computed(() =>
  Math.max(0, (props.mediaUrls?.length ?? 0) - 1) * GAP_PX,
);

const computedRowHeightPx = computed(() => {
  if (!allLoaded.value || !rowWidth.value || !sumAspectRatios.value) return null;
  const height = (rowWidth.value - gapTotal.value) / sumAspectRatios.value;
  return Math.min(height, MAX_ROW_HEIGHT_PX);
});

watch(computedRowHeightPx, (height) => {
  if (height != null) stableRowHeightPx.value = height;
});

const rowHeightPx = computed(
  () => computedRowHeightPx.value ?? stableRowHeightPx.value,
);

const rowStyle = computed(() => {
  const height = rowHeightPx.value;
  return height ? { height: `${height}px` } : undefined;
});

const isLayoutReady = computed(
  () => Boolean(allLoaded.value && rowHeightPx.value),
);

function itemWidthPx(index: number): string | undefined {
  const height = rowHeightPx.value;
  if (!height) return undefined;
  const ratio = aspectRatios.value[index] ?? 1;
  return `${height * ratio}px`;
}

function registerImage(img: HTMLImageElement | null, index: number) {
  if (!img || loaded.value[index]) return;
  if (img.complete && img.naturalWidth > 0) {
    setRatio(index, img.naturalWidth / img.naturalHeight);
  }
}

function onImageLoad(event: Event, index: number) {
  const img = event.target as HTMLImageElement;
  if (!img.naturalWidth || !img.naturalHeight || loaded.value[index]) return;
  setRatio(index, img.naturalWidth / img.naturalHeight);
}

function setRatio(index: number, ratio: number) {
  const url = props.mediaUrls?.[index];
  if (!url) return;

  const prevRatio = aspectRatios.value[index];
  const wasLoaded = loaded.value[index];
  if (wasLoaded && Math.abs(prevRatio - ratio) < 0.001) return;

  setCachedMediaRatio(url, ratio);

  const nextRatios = [...aspectRatios.value];
  nextRatios[index] = ratio;
  aspectRatios.value = nextRatios;

  if (!wasLoaded) {
    const nextLoaded = [...loaded.value];
    nextLoaded[index] = true;
    loaded.value = nextLoaded;
  }
}

function updateRowWidth(width: number) {
  if (Math.abs(width - rowWidth.value) < 0.5) return;
  rowWidth.value = width;
}

onMounted(() => {
  if (!rowRef.value) return;
  resizeObserver = new ResizeObserver(([entry]) => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      updateRowWidth(entry.contentRect.width);
    });
  });
  resizeObserver.observe(rowRef.value);
  updateRowWidth(rowRef.value.clientWidth);

  if (allMediaCached(props.mediaUrls) && props.mediaUrls?.length) {
    syncFromUrls(props.mediaUrls);
  }
});

onUnmounted(() => {
  cancelAnimationFrame(resizeRaf);
  resizeObserver?.disconnect();
});
</script>

<template>
  <div class="question-content" :class="{ large }">
    <div v-if="mediaUrls?.length" ref="rowRef" class="media-row-measure">
      <div
        class="media-row"
        :class="{ 'media-row--ready': isLayoutReady }"
        :style="rowStyle"
      >
        <div
          v-for="(url, index) in mediaUrls"
          :key="url"
          class="media-image-container"
          :style="{ width: itemWidthPx(index) }"
        >
          <img
            :ref="(el) => registerImage(el as HTMLImageElement | null, index)"
            :src="url"
            alt=""
            class="media-image"
            :class="{ 'media-image--loaded': loaded[index] }"
            @load="onImageLoad($event, index)"
          />
        </div>
      </div>
    </div>
    <p v-if="prompt" class="question-text">{{ prompt }}</p>
  </div>
</template>

<style scoped>
.question-content {
  display: grid;
  gap: 16px;
}

.media-row-measure {
  width: 100%;
}

.media-row {
  display: flex;
  align-items: stretch;
  justify-content: center;
  width: 100%;
  min-height: 6rem;
  max-height: 400px;
  gap: 16px;
  transition: height 0.15s ease;
}

.media-row--ready {
  min-height: 0;
}

.media-image-container {
  flex: none;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
}

.media-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.media-image--loaded {
  opacity: 1;
}

.large .media-row {
  min-height: 10rem;
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
