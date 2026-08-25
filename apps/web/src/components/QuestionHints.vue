<script setup lang="ts">
import { computed } from 'vue';
import { formatHintsCount, formatHintsProgress } from '@humiliation-game/shared';
import Icon from './Icon.vue';

const props = defineProps<{
  hints?: string[];
  hintsTotal?: number;
}>();

const revealedCount = computed(() => props.hints?.length ?? 0);

const caption = computed(() => {
  const total = props.hintsTotal ?? 0;
  if (revealedCount.value > 0) {
    return `Подсказки ${formatHintsProgress(revealedCount.value, total)}`;
  }
  return formatHintsCount(total);
});
</script>

<template>
  <p class="hints-caption">
    <Icon name="hint" :size="14" />
    {{ caption }}
  </p>
  <div v-if="hintsTotal" class="hints-list">
    <p v-for="(hint, index) in hints" :key="`${index}-${hint}`" class="hint"
      :class="{ 'hint-latest': index === revealedCount - 1 }">
      {{ index + 1 }}. {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.hints-list {
  display: block;
  margin-bottom: 16px;
}

.hints-caption {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #92400e;
  font-weight: bold;
  margin-top: 16px;
}

.hint {
  background: #fef3c7;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 8px 0 0;
}

.hint-latest {
  box-shadow: 0 0 0 2px #f59e0b;
  animation: hint-pop 0.45s ease-out;
}

@keyframes hint-pop {
  from {
    transform: scale(0.98);
    opacity: 0.65;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
