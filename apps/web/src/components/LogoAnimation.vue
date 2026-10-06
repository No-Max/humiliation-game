<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

const FRAME_MS = 100;
const PAUSE_MS = 5000;

const frames = Object.entries(
  import.meta.glob('../assets/logo-animation/*.svg', {
    eager: true,
    import: 'default',
  }),
)
  .map(([path, url]) => ({
    n: Number(/(\d+)\.svg$/.exec(path)?.[1]),
    url: url as string,
  }))
  .filter((frame) => Number.isFinite(frame.n))
  .sort((a, b) => a.n - b.n)
  .map((frame) => frame.url);

const frameIndex = ref(0);
let timer: ReturnType<typeof setTimeout> | undefined;

function schedule(ms: number, fn: () => void) {
  timer = setTimeout(fn, ms);
}

function playNextFrame() {
  if (frames.length < 2) return;

  if (frameIndex.value >= frames.length - 1) {
    schedule(PAUSE_MS, () => {
      frameIndex.value = 0;
      schedule(FRAME_MS, playNextFrame);
    });
    return;
  }

  frameIndex.value += 1;
  schedule(FRAME_MS, playNextFrame);
}

onMounted(() => {
  if (frames.length < 2) return;
  schedule(FRAME_MS, playNextFrame);
});

onUnmounted(() => {
  if (timer) clearTimeout(timer);
});
</script>

<template>
  <img
    v-if="frames.length"
    :src="frames[frameIndex]"
    alt=""
    class="logo-animation"
    width="32"
    height="32"
  />
</template>

<style scoped>
.logo-animation {
  display: inline-block;
  vertical-align: middle;
  width: 32px;
  height: 32px;
  object-fit: contain;
}
</style>
