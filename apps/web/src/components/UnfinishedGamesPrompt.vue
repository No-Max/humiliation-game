<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import Button from './Button.vue';
import { shouldShowUnfinishedPrompt, useUnfinishedGames } from '../composables/useUnfinishedGames';

const route = useRoute();
const { loading, hasUnfinished, refresh } = useUnfinishedGames();

const visible = computed(
  () => !loading.value && hasUnfinished.value && shouldShowUnfinishedPrompt(route.path),
);

onMounted(refresh);
watch(
  () => route.path,
  (path) => {
    if (path === '/series') refresh();
  },
);
</script>

<template>
  <div v-if="visible" class="card unfinished-games-prompt">
    <div class="unfinished-prompt-body">
      <h2 class="unfinished-prompt-title">У вас есть незавершенные игры.</h2>
      <p class="unfinished-prompt-desc text-muted-sm">
        Мы сохранили прогресс незавершенных вами игр, мы подумали, что вы захотите продолжить 😉
      </p>
    </div>
    <Button class="unfinished-prompt-btn" to="/games" compact>Продолжить</Button>
  </div>
</template>

<style scoped>
.unfinished-games-prompt {
  border-left: 4px solid var(--color-accent);
  margin-bottom: 16px;
}

.unfinished-games-prompt::after {
  content: '';
  display: table;
  clear: both;
}

.unfinished-prompt-body {
  display: inline-block;
  vertical-align: middle;
  width: calc(100% - 140px);
  min-width: 0;
}

.unfinished-prompt-title {
  margin: 0 0 8px;
  font-size: inherit;
  font-weight: bold;
}

.unfinished-prompt-desc {
  margin: 0;
}

.unfinished-prompt-btn {
  float: right;
}
</style>
