<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { adminApi } from '../lib/api';
import { buildDefaultQuestionCreateBody } from '../lib/questionDefaults';
import {
  getSeriesIdFromRoute,
  tourQuestionEditRoute,
} from '../lib/tourNavigation';
import AdminIcon from '../components/AdminIcon.vue';
import AdminBreadcrumbs from '../components/AdminBreadcrumbs.vue';
import { formatQuestionCount } from '@humiliation-game/shared';
import { stripHtml } from '../lib/htmlText';
import { buildTourContextCrumbs, useSeriesBreadcrumb } from '../lib/adminBreadcrumbs';

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
const deletingId = ref<string | null>(null);
const creatingQuestion = ref(false);
const reordering = ref(false);
const error = ref('');

const tourId = () => String(route.params.tourId);
const seriesId = computed(() => getSeriesIdFromRoute(route));
const { seriesMeta } = useSeriesBreadcrumb(seriesId);

const breadcrumbs = computed(() => {
  const items = buildTourContextCrumbs(seriesId.value, seriesMeta.value);
  if (tour.value) {
    items.push({ label: `Задания: ${tour.value.title}` });
  } else if (loading.value) {
    items.push({ label: 'Задания' });
  }
  return items;
});

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    if (!seriesId.value) {
      loadError.value = 'Задания редактируются только из выпуска';
      tour.value = null;
      return;
    }
    const query = `?seriesId=${encodeURIComponent(seriesId.value)}`;
    tour.value = await adminApi(`/tours/${tourId()}${query}`);
  } catch (e) {
    tour.value = null;
    loadError.value = e instanceof Error ? e.message : 'Не удалось загрузить тур';
  } finally {
    loading.value = false;
  }
}

onMounted(load);

watch(
  () => route.params.tourId,
  () => {
    void load();
  },
);

async function openAddQuestion() {
  if (!tour.value) return;
  if (!seriesId.value) {
    error.value = 'Задания добавляются только из выпуска';
    return;
  }

  creatingQuestion.value = true;
  error.value = '';
  try {
    const created = await adminApi<{ id: string }>(`/tours/${tour.value.id}/questions`, {
      method: 'POST',
      body: JSON.stringify(buildDefaultQuestionCreateBody(seriesId.value)),
    });
    router.push(tourQuestionEditRoute(tour.value.id, created.id, seriesId.value));
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось создать задание';
  } finally {
    creatingQuestion.value = false;
  }
}

function openEditQuestion(question: Question) {
  if (!tour.value) return;
  router.push(tourQuestionEditRoute(tour.value.id, question.id, seriesId.value));
}

async function removeQuestion(question: Question) {
  if (!tour.value) return;
  const prompt = stripHtml(question.prompt ?? '') || 'это задание';
  if (!window.confirm(`Удалить задание «${prompt}»?`)) return;

  deletingId.value = question.id;
  error.value = '';
  try {
    await adminApi(`/tours/questions/${question.id}`, { method: 'DELETE' });
    await load();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось удалить задание';
  } finally {
    deletingId.value = null;
  }
}

async function moveQuestion(question: Question, direction: -1 | 1) {
  if (!tour.value) return;
  const ids = tour.value.questions.map((q) => q.id);
  const index = ids.indexOf(question.id);
  const target = index + direction;
  if (target < 0 || target >= ids.length) return;

  [ids[index], ids[target]] = [ids[target], ids[index]];

  reordering.value = true;
  error.value = '';
  try {
    tour.value = await adminApi(`/tours/${tour.value.id}/questions/order`, {
      method: 'PUT',
      body: JSON.stringify({
        questionIds: ids,
        seriesId: seriesId.value,
      }),
    });
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось изменить порядок';
  } finally {
    reordering.value = false;
  }
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m} мин ${s} сек` : `${m} мин`;
}
</script>

<template>
  <div>
    <AdminBreadcrumbs :items="breadcrumbs" />

    <p v-if="loading" class="field-hint">Загрузка…</p>
    <p v-else-if="loadError" class="error">{{ loadError }}</p>

    <template v-else-if="tour">
      <h1 class="page-title">Задания: {{ tour.title }}</h1>

      <div style="display: flex; justify-content: space-between; align-items: center; margin: 1rem 0">
        <h2 style="margin: 0">
          Список заданий
          <span class="question-count">· {{ formatQuestionCount(tour.questions.length) }}</span>
        </h2>
        <button class="btn" type="button" :disabled="creatingQuestion" @click="openAddQuestion">
          <AdminIcon name="plus-icon" />
          {{ creatingQuestion ? 'Создание…' : 'Задание' }}
        </button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="card">
        <ul v-if="tour.questions.length" class="question-list">
          <li v-for="(q, index) in tour.questions" :key="q.id" class="question-item">
            <div class="question-content">
              <div>{{ stripHtml(q.prompt ?? '') }}</div>
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
            <div class="question-actions">
              <button
                class="btn btn-secondary btn-sm btn-icon"
                type="button"
                aria-label="Поднять выше"
                title="Поднять выше"
                :disabled="index === 0 || reordering || deletingId !== null"
                @click="moveQuestion(q, -1)"
              >
                <AdminIcon name="arrow-up-icon" />
              </button>
              <button
                class="btn btn-secondary btn-sm btn-icon"
                type="button"
                aria-label="Опустить ниже"
                :disabled="index === tour.questions.length - 1 || reordering || deletingId !== null"
                @click="moveQuestion(q, 1)"
                title="Опустить ниже"
              >
                <AdminIcon name="arrow-down-icon" />
              </button>
              <button
                class="btn btn-danger btn-sm"
                type="button"
                :disabled="deletingId === q.id || reordering"
                @click="removeQuestion(q)"
                aria-label="Удалить"
                title="Удалить"
              >
                <AdminIcon name="trash-icon" />
                {{ deletingId === q.id ? 'Удаление…' : '' }}
              </button>
              <button
                class="btn btn-secondary btn-sm"
                type="button"
                :disabled="reordering || deletingId !== null"
                @click="openEditQuestion(q)"
              >
                <AdminIcon name="pencil-icon" />
                Редактировать
              </button>
            </div>
          </li>
        </ul>
        <p v-else style="color: #6b7280; margin: 0">Заданий пока нет</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
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

.question-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.question-meta {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.question-count {
  font-weight: normal;
  font-size: 1rem;
  color: #6b7280;
}
</style>
