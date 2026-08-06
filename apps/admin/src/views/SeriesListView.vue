<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { adminApi } from '../lib/api';

interface SeriesRow {
  id: string;
  title: string;
  number: number;
  status: string;
  _count: { tours: number };
}

const series = ref<SeriesRow[]>([]);
const loading = ref(true);

onMounted(async () => {
  series.value = await adminApi('/series');
  loading.value = false;
});

async function createSeries() {
  const title = prompt('Название выпуска');
  if (!title) return;
  const number = Number(prompt('Номер выпуска', String(series.value.length + 1)));
  if (!number) return;
  await adminApi('/series', {
    method: 'POST',
    body: JSON.stringify({ title, number, status: 'DRAFT' }),
  });
  series.value = await adminApi('/series');
}
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem">
      <h1 class="page-title">Выпуски</h1>
      <button class="btn" @click="createSeries">+ Новый выпуск</button>
    </div>

    <div v-if="loading" class="card">Загрузка...</div>
    <div v-else class="card">
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Название</th>
            <th>Статус</th>
            <th>Туров</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in series" :key="item.id">
            <td>{{ item.number }}</td>
            <td>{{ item.title }}</td>
            <td>{{ item.status }}</td>
            <td>{{ item._count.tours }}</td>
            <td><RouterLink :to="`/series/${item.id}`">Редактировать</RouterLink></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
