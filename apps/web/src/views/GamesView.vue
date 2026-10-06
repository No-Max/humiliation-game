<script setup lang="ts">
import { onMounted } from 'vue';
import UnfinishedGamesList from '../components/UnfinishedGamesList.vue';
import { useUnfinishedGames } from '../composables/useUnfinishedGames';

const { sessions, loading, refresh, dismiss } = useUnfinishedGames();

onMounted(refresh);
</script>

<template>
  <div>
    <h1 class="page-title">Игры</h1>
    <div v-if="loading" class="card">
      <p class="text-muted-sm">Загрузка…</p>
    </div>
    <div v-else-if="!sessions.length" class="card">
      <p class="text-muted-sm">Незавершённых игр нет.</p>
    </div>
    <div v-else class="card unfinished-games-card">
      <h2 class="unfinished-title">Незавершённые игры</h2>
      <p class="unfinished-intro text-muted-sm">
        У вас есть сохранённые игры — продолжите с того места, где остановились
      </p>
      <UnfinishedGamesList :sessions="sessions" @dismiss="dismiss" />
    </div>
  </div>
</template>

<style scoped>
.unfinished-games-card {
  border-left: 4px solid var(--color-accent);
  margin-top: 16px;
}

.unfinished-title {
  margin-bottom: 8px;
}

.unfinished-intro {
  margin-bottom: 16px;
}
</style>
