<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { adminApi } from '../lib/api';
import {
  getSeriesIdFromRoute,
  tourQuestionEditRoute,
  tourQuestionNewRoute,
  toursBackLabel,
  toursBackRoute,
} from '../lib/tourNavigation';

interface Question {
  id: string;
  prompt?: string;
  sortOrder: number;
  correctAnswer: string;
  hints?: string[];
  acceptableAnswers?: string[];
  points?: number | null;
  timeLimitSec?: number | null;
  contentType?: string;
  mediaUrls?: string[];
  answerType?: string;
  choices?: string[];
}

interface TourDetail {
  id: string;
  title: string;
  rules?: string;
  defaultPoints: number;
  defaultTimeLimitSec: number;
  questions: Question[];
}

const route = useRoute();
const router = useRouter();
const tour = ref<TourDetail | null>(null);
const loading = ref(true);
const loadError = ref('');

const tourId = () => String(route.params.tourId);
const seriesId = computed(() => getSeriesIdFromRoute(route));
const backRoute = computed(() => toursBackRoute(seriesId.value));
const backLabel = computed(() => toursBackLabel(seriesId.value));

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    tour.value = await adminApi(`/tours/${tourId()}`);
  } catch (e) {
    tour.value = null;
    loadError.value = e instanceof Error ? e.message : 'Не удалось загрузить тур';
  } finally {
    loading.value = false;
  }
}

onMounted(load);

function openAddQuestion() {
  if (!tour.value) return;
  router.push(tourQuestionNewRoute(tour.value.id, seriesId.value));
}

function openEditQuestion(question: Question) {
  if (!tour.value) return;
  router.push(tourQuestionEditRoute(tour.value.id, question.id, seriesId.value));
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m} мин ${s} сек` : `${m} мин`;
}
</script>

<template>
  <div>
    <p class="back-link">
      <RouterLink :to="backRoute">{{ backLabel }}</RouterLink>
    </p>

    <p v-if="loading" class="field-hint">Загрузка…</p>
    <p v-else-if="loadError" class="error">{{ loadError }}</p>

    <template v-else-if="tour">
      <h1 class="page-title">Задания: {{ tour.title }}</h1>
      <p class="field-hint" style="margin-top: 0">
        {{ tour.defaultPoints }} б. · ⏱ {{ formatTime(tour.defaultTimeLimitSec) }}
        <span v-if="tour.rules"> · {{ tour.rules }}</span>
      </p>

      <div style="display: flex; justify-content: space-between; align-items: center; margin: 1rem 0">
        <h2 style="margin: 0">Список заданий</h2>
        <button class="btn" type="button" @click="openAddQuestion">+ Задание</button>
      </div>

      <div class="card">
        <ul v-if="tour.questions.length" class="question-list">
          <li v-for="q in tour.questions" :key="q.id" class="question-item">
            <div class="question-content">
              <div>{{ q.prompt }}</div>
              <div class="question-meta">
                <span v-if="q.contentType === 'IMAGE_TEXT'">🖼 · </span>
                <span v-if="q.answerType === 'CHOICE'">🔘 · </span>
                <span>→ <em>{{ q.correctAnswer }}</em></span>
                <span v-if="q.answerType === 'CHOICE' && q.choices?.length"> · {{ q.choices.length }} вар.</span>
                <span v-if="q.acceptableAnswers?.length"> · +{{ q.acceptableAnswers.length }} син.</span>
                <span v-if="q.hints?.length"> · 💡 {{ q.hints.length }}</span>
                <span> · {{ q.points ?? tour.defaultPoints }} б.</span>
                <span> · ⏱ {{ formatTime(q.timeLimitSec ?? tour.defaultTimeLimitSec) }}</span>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" type="button" @click="openEditQuestion(q)">
              Изменить
            </button>
          </li>
        </ul>
        <p v-else style="color: #6b7280; margin: 0">Заданий пока нет</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.back-link {
  margin-bottom: 0.75rem;
}

.back-link a {
  color: #4f46e5;
  text-decoration: none;
}

.question-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.question-item {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-top: 1px solid #e5e7eb;
}

.question-item:first-child {
  border-top: none;
  padding-top: 0;
}

.question-content {
  flex: 1;
  min-width: 0;
}

.question-meta {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.btn-sm {
  font-size: 0.8125rem;
  padding: 0.35rem 0.65rem;
  flex-shrink: 0;
}
</style>
