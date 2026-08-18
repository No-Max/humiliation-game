<script setup lang="ts">
import { computed } from 'vue';
import { formatHintsCount, formatHintsProgress } from '@humiliation-game/shared';

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
  <div v-if="hintsTotal" class="hints-list">
    <p class="hints-caption">
      💡 {{ caption }}
    </p>
    <p
      v-for="(hint, index) in hints"
      :key="`${index}-${hint}`"
      class="hint"
      :class="{ 'hint-latest': index === revealedCount - 1 }"
    >
      {{ index + 1 }}. {{ hint }}
    </p>
  </div>
</template>
