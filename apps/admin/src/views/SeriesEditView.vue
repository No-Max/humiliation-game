<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { adminApi } from '../lib/api';

interface Question {
  id: string;
  prompt?: string;
  sortOrder: number;
  correctAnswer: string;
}

interface Tour {
  id: string;
  title: string;
  rules?: string;
  defaultPoints: number;
  sortOrder: number;
  questions: Question[];
}

interface SeriesDetail {
  id: string;
  title: string;
  number: number;
  description?: string;
  status: string;
  tours: Tour[];
}

const route = useRoute();
const series = ref<SeriesDetail | null>(null);

async function load() {
  series.value = await adminApi(`/series/${route.params.id}`);
}

onMounted(load);

async function addTour() {
  const title = prompt('Название тура');
  if (!title || !series.value) return;
  await adminApi(`/series/${series.value.id}/tours`, {
    method: 'POST',
    body: JSON.stringify({ title, sortOrder: series.value.tours.length }),
  });
  await load();
}

async function publish() {
  if (!series.value) return;
  await adminApi(`/series/${series.value.id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...series.value, status: 'PUBLISHED' }),
  });
  await load();
}

async function addQuestion(tourId: string) {
  const promptText = prompt('Текст задания');
  const answer = prompt('Правильный ответ');
  if (!promptText || !answer) return;
  await adminApi(`/series/tours/${tourId}/questions`, {
    method: 'POST',
    body: JSON.stringify({
      prompt: promptText,
      correctAnswer: answer,
      contentType: 'TEXT',
      answerType: 'TEXT',
    }),
  });
  await load();
}
</script>

<template>
  <div v-if="series">
    <h1 class="page-title">Выпуск {{ series.number }}: {{ series.title }}</h1>

    <div class="card">
      <p>Статус: <strong>{{ series.status }}</strong></p>
      <button v-if="series.status !== 'PUBLISHED'" class="btn" style="margin-top: 0.75rem" @click="publish">
        Опубликовать
      </button>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin: 1rem 0">
      <h2>Туры</h2>
      <button class="btn" @click="addTour">+ Тур</button>
    </div>

    <div v-for="tour in series.tours" :key="tour.id" class="card">
      <h3>{{ tour.title }} ({{ tour.defaultPoints }} б.)</h3>
      <p v-if="tour.rules" style="color: #6b7280; margin: 0.5rem 0">{{ tour.rules }}</p>

      <ul style="margin: 0.75rem 0; padding-left: 1.25rem">
        <li v-for="q in tour.questions" :key="q.id">
          {{ q.prompt }} → <em>{{ q.correctAnswer }}</em>
        </li>
      </ul>

      <button class="btn" @click="addQuestion(tour.id)">+ Задание</button>
    </div>
  </div>
</template>
