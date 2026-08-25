<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { formatTourQuestionMeta } from '@humiliation-game/shared';
import { api } from '../lib/api';
import Button from '../components/Button.vue';

interface SeriesItem {
  id: string;
  title: string;
  number: number;
  description?: string;
  tours: {
    id: string;
    title: string;
    limitQuestionsToTeamCount?: boolean;
    _count: { questions: number };
  }[];
}

const series = ref<SeriesItem[]>([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    series.value = await api('/series');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка загрузки';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <h1 class="page-title">Выпуски</h1>
    <p class="series-loading" v-if="loading">Загрузка...</p>
    <p class="series-error" v-else-if="error">{{ error }}</p>
    <div class="card" v-else-if="!series.length">Пока нет опубликованных выпусков</div>
    <div v-for="item in series" :key="item.id" class="card">
      <h2>#{{ item.number }}: {{ item.title }}</h2>
      <div
        v-if="item.description"
        class="rich-text-preview series-description"
        v-html="item.description"
      />
      <ul v-if="item.tours.length" class="series-tours-list">
        <li v-for="tour in item.tours" :key="tour.id">
          {{ tour.title }} —
          {{ formatTourQuestionMeta(tour._count.questions, tour.limitQuestionsToTeamCount) }}
        </li>
      </ul>
      <p v-else class="empty-tours text-muted-sm">Туры не добавлены</p>
      <Button :to="`/lobby/${item.id}`">Играть</Button>
    </div>
  </div>
</template>

<style scoped>
.series-description {
  margin: 8px 0;
}

.series-loading, .series-error {
  margin-top: 16px;
}

.series-tours-list {
  list-style: none;
  padding: 0;
  margin: 8px 0 16px;
  color: #6b7280;
  font-size: 14px;
  display: grid;
  gap: 4px;
}

.empty-tours {
  margin: 8px 0;
}

.card {
  margin-top: 16px;
}
</style>
