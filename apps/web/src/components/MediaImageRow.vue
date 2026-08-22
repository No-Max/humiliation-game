<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  allMediaCached,
  mediaUrlsKey,
  setCachedMediaRatio,
  syncMediaLayoutState,
} from '../lib/mediaLayoutCache';

const GAP_PX = 16;
const ROW_PADDING_PX = 16;
const MAX_ROW_HEIGHT_PX = 400;

const props = defineProps<{
  mediaUrls?: string[];
  large?: boolean;
}>();

const rowRef = ref<HTMLElement | null>(null);
const rowWidth = ref(0);
const aspectRatios = ref<number[]>([]);
const loaded = ref<boolean[]>([]);
const stableRowHeightPx = ref<number | null>(null);
const stableAtWidth = ref<number | null>(null);
const isWideLayout = ref(true);

let resizeObserver: ResizeObserver | undefined;
let layoutMediaQuery: MediaQueryList | undefined;
let resizeRaf = 0;

function onLayoutMediaChange(event: MediaQueryListEvent | MediaQueryList) {
  isWideLayout.value = event.matches;
  if (!event.matches) resetStableLayout();
}

function resetStableLayout() {
  stableRowHeightPx.value = null;
  stableAtWidth.value = null;
}

function syncFromUrls(urls: string[] | undefined) {
  const next = syncMediaLayoutState(urls);
  aspectRatios.value = next.aspectRatios;
  loaded.value = next.loaded;
}

watch(
  () => mediaUrlsKey(props.mediaUrls),
  () => {
    resetStableLayout();
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
  const height =
    (rowWidth.value - ROW_PADDING_PX - gapTotal.value) / sumAspectRatios.value;
  return Math.min(height, MAX_ROW_HEIGHT_PX);
});

watch(computedRowHeightPx, (height) => {
  if (height != null && rowWidth.value > 0) {
    stableRowHeightPx.value = height;
    stableAtWidth.value = rowWidth.value;
  }
});

const rowHeightPx = computed(() => {
  const computed = computedRowHeightPx.value;
  if (computed != null) return computed;

  if (
    stableRowHeightPx.value != null
    && stableAtWidth.value != null
    && rowWidth.value > 0
    && Math.abs(rowWidth.value - stableAtWidth.value) < 1
  ) {
    return stableRowHeightPx.value;
  }

  return null;
});

const rowStyle = computed(() => {
  if (!isWideLayout.value) return undefined;
  const height = rowHeightPx.value;
  if (!height) return undefined;
  const clamped = Math.min(height, MAX_ROW_HEIGHT_PX);
  return {
    height: `${clamped}px`,
    maxHeight: `${MAX_ROW_HEIGHT_PX}px`,
  };
});

const isLayoutReady = computed(
  () =>
    isWideLayout.value
    && Boolean(allLoaded.value && rowHeightPx.value && rowWidth.value > 0),
);

const useComputedItemWidths = computed(
  () => isLayoutReady.value && isWideLayout.value,
);

function itemWidthPx(index: number): string | undefined {
  const height = rowHeightPx.value;
  const width = rowWidth.value;
  if (!height || !width) return undefined;

  const ratio = aspectRatios.value[index] ?? 1;
  const totalRatio = sumAspectRatios.value;
  if (!totalRatio) return undefined;

  const available = Math.max(0, width - ROW_PADDING_PX - gapTotal.value);
  const itemWidth = Math.min(
    height * ratio,
    (available * ratio) / totalRatio,
  );

  return `${Math.max(0, itemWidth)}px`;
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
  if (width <= 0) {
    rowWidth.value = 0;
    resetStableLayout();
    return;
  }

  if (
    stableAtWidth.value != null
    && Math.abs(width - stableAtWidth.value) >= 1
  ) {
    resetStableLayout();
  }

  if (Math.abs(width - rowWidth.value) < 0.5) return;
  rowWidth.value = width;
}

onMounted(() => {
  layoutMediaQuery = window.matchMedia('(min-width: 1024px)');
  onLayoutMediaChange(layoutMediaQuery);
  layoutMediaQuery.addEventListener('change', onLayoutMediaChange);

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
  layoutMediaQuery?.removeEventListener('change', onLayoutMediaChange);
});
</script>

<template>
  <div v-if="mediaUrls?.length" ref="rowRef" class="media-row-measure" :class="{ large }">
    <div
      class="media-row"
      :class="{
        'media-row--ready': isLayoutReady,
        'media-row--compact': !isWideLayout,
      }"
      :style="rowStyle"
    >
      <div
        v-for="(url, index) in mediaUrls"
        :key="url"
        class="media-image-container"
        :style="useComputedItemWidths ? { width: itemWidthPx(index) } : undefined"
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
</template>

<style scoped>
.media-row-measure {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.media-row {
  display: flex;
  align-items: stretch;
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 6rem;
  padding: 8px;
  box-sizing: border-box;
  transition: height 0.15s ease;
}

.media-row--ready {
  flex-wrap: nowrap;
  min-height: 0;
}

.media-image-container {
  flex: 1 1 280px;
  min-width: 0;
  max-width: 100%;
  height: auto;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
  box-sizing: border-box;
}

.media-row:not(.media-row--ready) .media-image-container {
  margin-right: 16px;
  margin-bottom: 16px;
}

.media-row--ready .media-image-container {
  flex: 0 1 auto;
  height: 100%;
  margin: 0;
}

.media-row--ready .media-image-container + .media-image-container {
  margin-left: 16px;
}

.media-image {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.media-row--ready .media-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.media-image--loaded {
  opacity: 1;
}

.large .media-row {
  min-height: 10rem;
}

@media (max-width: 1023px) {
  .media-row,
  .media-row--ready {
    flex-wrap: wrap;
    height: auto !important;
    max-height: none;
    min-height: 0;
  }

  .media-row--compact .media-image-container,
  .media-row--ready.media-row--compact .media-image-container {
    flex: 0 0 calc(50% - 8px);
    width: calc(50% - 8px) !important;
    max-width: calc(50% - 8px);
    height: auto;
    margin: 0 16px 16px 0;
  }

  .media-row--compact .media-image-container:nth-child(2n),
  .media-row--ready.media-row--compact .media-image-container:nth-child(2n) {
    margin-right: 0;
  }

  .media-row--compact .media-image,
  .media-row--ready.media-row--compact .media-image {
    height: auto;
    max-height: 280px;
    object-fit: contain;
  }
}
</style>
