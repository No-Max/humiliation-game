<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { formatQuestionCount } from '@humiliation-game/shared';
import { api } from '../lib/api';

interface SeriesItem {
  id: string;
  title: string;
  number: number;
  description?: string;
  tours: { id: string; title: string; _count: { questions: number } }[];
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
    <p v-if="loading">Загрузка...</p>
    <p v-else-if="error">{{ error }}</p>
    <div v-else-if="!series.length" class="card">Пока нет опубликованных выпусков</div>
    <div v-for="item in series" :key="item.id" class="card">
      <h2>Выпуск {{ item.number }}: {{ item.title }}</h2>
      <div
        v-if="item.description"
        class="rich-text-preview series-description"
        v-html="item.description"
      />
      <ul v-if="item.tours.length" class="series-tours-list">
        <li v-for="tour in item.tours" :key="tour.id">
          {{ tour.title }} — {{ formatQuestionCount(tour._count.questions) }}
        </li>
      </ul>
      <p v-else style="color: #6b7280; font-size: 0.875rem; margin: 0.5rem 0">Туры не добавлены</p>
      <RouterLink :to="`/lobby/${item.id}`" class="btn">Играть</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.series-description {
  margin: 0.5rem 0;
}

.series-tours-list {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 1rem;
  color: #6b7280;
  font-size: 0.875rem;
  display: grid;
  gap: 0.25rem;
}
</style>
