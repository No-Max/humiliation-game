<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { api } from '../lib/api';

interface SeriesItem {
  id: string;
  title: string;
  number: number;
  description?: string;
  tours: { title: string; _count: { questions: number } }[];
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
      <p v-if="item.description" style="margin: 0.5rem 0">{{ item.description }}</p>
      <p style="color: #6b7280; font-size: 0.875rem; margin: 0.5rem 0">
        Туры: {{ item.tours.map((t) => t.title).join(', ') }}
      </p>
      <RouterLink :to="`/lobby/${item.id}`" class="btn">Играть</RouterLink>
    </div>
  </div>
</template>
