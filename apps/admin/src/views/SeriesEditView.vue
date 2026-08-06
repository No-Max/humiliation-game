<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { adminApi } from '../lib/api';
import AdminModal from '../components/AdminModal.vue';

interface Question {
  id: string;
  prompt?: string;
  sortOrder: number;
  correctAnswer: string;
  hints?: string[];
  acceptableAnswers?: string[];
  timeLimitSec?: number | null;
}

interface Tour {
  id: string;
  title: string;
  rules?: string;
  defaultPoints: number;
  defaultTimeLimitSec: number;
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

type ModalKind = 'addTour' | 'editTourTime';

const route = useRoute();
const router = useRouter();
const series = ref<SeriesDetail | null>(null);
const modalKind = ref<ModalKind | null>(null);
const activeTour = ref<Tour | null>(null);
const saving = ref(false);
const error = ref('');

const form = ref({
  title: '',
  defaultTimeLimitSec: '60',
});

async function load() {
  series.value = await adminApi(`/series/${route.params.id}`);
}

onMounted(load);

function resetForm() {
  form.value = {
    title: '',
    defaultTimeLimitSec: '60',
  };
}

function closeModal() {
  modalKind.value = null;
  activeTour.value = null;
  error.value = '';
}

function openAddTour() {
  resetForm();
  error.value = '';
  modalKind.value = 'addTour';
}

function openEditTourTime(tour: Tour) {
  activeTour.value = tour;
  resetForm();
  form.value.defaultTimeLimitSec = String(tour.defaultTimeLimitSec);
  error.value = '';
  modalKind.value = 'editTourTime';
}

function openAddQuestion(tour: Tour) {
  if (!series.value) return;
  router.push(`/series/${series.value.id}/tours/${tour.id}/questions/new`);
}

function openEditQuestion(tour: Tour, question: Question) {
  if (!series.value) return;
  router.push(
    `/series/${series.value.id}/tours/${tour.id}/questions/${question.id}`,
  );
}

const modalTitle = {
  addTour: 'Новый тур',
  editTourTime: 'Время на ответ — тур',
} as const;

async function publish() {
  if (!series.value) return;
  await adminApi(`/series/${series.value.id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...series.value, status: 'PUBLISHED' }),
  });
  await load();
}

function parseTimeLimit(value: string, min = 5): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const sec = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(sec) || sec < min) return NaN;
  return sec;
}

async function submitModal() {
  if (!series.value || !modalKind.value) return;

  saving.value = true;
  error.value = '';

  try {
    if (modalKind.value === 'addTour') {
      const title = form.value.title.trim();
      if (!title) {
        error.value = 'Введите название тура';
        return;
      }
      const defaultTimeLimitSec = parseTimeLimit(form.value.defaultTimeLimitSec) ?? 60;
      if (Number.isNaN(defaultTimeLimitSec)) {
        error.value = 'Укажите время не менее 5 секунд';
        return;
      }

      await adminApi(`/series/${series.value.id}/tours`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          sortOrder: series.value.tours.length,
          defaultTimeLimitSec,
        }),
      });
    }

    if (modalKind.value === 'editTourTime' && activeTour.value) {
      const defaultTimeLimitSec = parseTimeLimit(form.value.defaultTimeLimitSec);
      if (defaultTimeLimitSec == null || Number.isNaN(defaultTimeLimitSec)) {
        error.value = 'Укажите время не менее 5 секунд';
        return;
      }

      await adminApi(`/series/tours/${activeTour.value.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...activeTour.value, defaultTimeLimitSec }),
      });
    }

    await load();
    closeModal();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка сохранения';
  } finally {
    saving.value = false;
  }
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m} мин ${s} сек` : `${m} мин`;
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
      <button class="btn" type="button" @click="openAddTour">+ Тур</button>
    </div>

    <div v-for="tour in series.tours" :key="tour.id" class="card">
      <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: space-between">
        <h3 style="margin: 0">
          {{ tour.title }} ({{ tour.defaultPoints }} б.)
        </h3>
        <button class="btn btn-secondary" type="button" @click="openEditTourTime(tour)">
          ⏱ {{ formatTime(tour.defaultTimeLimitSec) }}
        </button>
      </div>
      <p v-if="tour.rules" style="color: #6b7280; margin: 0.5rem 0">{{ tour.rules }}</p>

      <ul class="question-list">
        <li v-for="q in tour.questions" :key="q.id" class="question-item">
          <div class="question-content">
            <div>{{ q.prompt }}</div>
            <div class="question-meta">
              <span>→ <em>{{ q.correctAnswer }}</em></span>
              <span v-if="q.acceptableAnswers?.length">
                · +{{ q.acceptableAnswers.length }} син.
              </span>
              <span v-if="q.hints?.length"> · 💡 {{ q.hints.length }}</span>
              <span> · ⏱ {{ formatTime(q.timeLimitSec ?? tour.defaultTimeLimitSec) }}</span>
            </div>
          </div>
          <button
            class="btn btn-secondary btn-sm"
            type="button"
            @click="openEditQuestion(tour, q)"
          >
            Изменить
          </button>
        </li>
      </ul>

      <button class="btn" type="button" @click="openAddQuestion(tour)">+ Задание</button>
    </div>

    <AdminModal
      v-if="modalKind"
      :open="!!modalKind"
      :title="modalTitle[modalKind]"
      :loading="saving"
      :submit-label="modalKind === 'addTour' ? 'Создать' : 'Сохранить'"
      @close="closeModal"
      @submit="submitModal"
    >
      <p v-if="error" class="error">{{ error }}</p>

      <template v-if="modalKind === 'addTour'">
        <label class="label" for="tour-title">Название тура</label>
        <input id="tour-title" v-model="form.title" class="input" placeholder="Например: Мемы" autofocus />
        <label class="label" for="tour-time">Время на ответ (сек)</label>
        <input
          id="tour-time"
          v-model="form.defaultTimeLimitSec"
          class="input"
          type="number"
          min="5"
          placeholder="60"
        />
        <p class="field-hint">По умолчанию 60 секунд (1 минута)</p>
      </template>

      <template v-else-if="modalKind === 'editTourTime' && activeTour">
        <p class="field-hint" style="margin-top: 0">Тур: {{ activeTour.title }}</p>
        <label class="label" for="edit-tour-time">Время на ответ (сек)</label>
        <input
          id="edit-tour-time"
          v-model="form.defaultTimeLimitSec"
          class="input"
          type="number"
          min="5"
          autofocus
        />
      </template>
    </AdminModal>
  </div>
</template>

<style scoped>
.question-list {
  margin: 0.75rem 0;
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
