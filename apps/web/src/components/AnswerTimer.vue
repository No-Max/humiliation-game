<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps<{
  deadlineAt?: number;
  paused?: boolean;
}>();

const now = ref(Date.now());
let interval: ReturnType<typeof setInterval> | undefined;

const remainingSec = computed(() => {
  if (!props.deadlineAt || props.paused) return null;
  return Math.max(0, Math.ceil((props.deadlineAt - now.value) / 1000));
});

const formatted = computed(() => {
  const sec = remainingSec.value;
  if (sec == null) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
});

const urgent = computed(() => remainingSec.value != null && remainingSec.value <= 10);

watch(() => props.deadlineAt, () => {
  now.value = Date.now();
});

onMounted(() => {
  interval = setInterval(() => {
    now.value = Date.now();
  }, 250);
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});
</script>

<template>
  <div v-if="remainingSec != null" class="answer-timer" :class="{ urgent }">
    ⏱ {{ formatted }}
  </div>
</template>

<style scoped>
.answer-timer {
  display: inline-block;
  font-size: 1.25rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #4f46e5;
  margin-bottom: 0.75rem;
}

.answer-timer.urgent {
  color: #dc2626;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  50% {
    opacity: 0.6;
  }
}
</style>
