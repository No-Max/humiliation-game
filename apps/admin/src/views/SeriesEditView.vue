<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { adminApi } from '../lib/api';
import AdminModal from '../components/AdminModal.vue';
import { tourQuestionsRoute } from '../lib/tourNavigation';

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

interface TourLibraryItem {
  id: string;
  title: string;
  rules?: string;
  defaultPoints: number;
  defaultTimeLimitSec: number;
  _count: { questions: number };
}

const route = useRoute();
const series = ref<SeriesDetail | null>(null);
const libraryTours = ref<TourLibraryItem[]>([]);
const showPickModal = ref(false);
const saving = ref(false);
const error = ref('');
const loading = ref(true);
const loadError = ref('');

const linkedTourIds = computed(
  () => new Set((series.value?.tours ?? []).map((t) => t.id)),
);

const availableTours = computed(() =>
  libraryTours.value.filter((t) => !linkedTourIds.value.has(t.id)),
);

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    series.value = await adminApi(`/series/${route.params.id}`);
  } catch (e) {
    series.value = null;
    loadError.value = e instanceof Error ? e.message : 'Не удалось загрузить выпуск';
  } finally {
    loading.value = false;
  }
}

onMounted(load);

async function publish() {
  if (!series.value) return;
  await adminApi(`/series/${series.value.id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...series.value, status: 'PUBLISHED' }),
  });
  await load();
}

async function openPickModal() {
  libraryTours.value = await adminApi('/tours');
  error.value = '';
  showPickModal.value = true;
}

function closePickModal() {
  showPickModal.value = false;
  error.value = '';
}

async function addTour(tourId: string) {
  if (!series.value) return;

  saving.value = true;
  error.value = '';
  try {
    series.value = await adminApi(`/series/${series.value.id}/tours`, {
      method: 'POST',
      body: JSON.stringify({ tourId }),
    });
    closePickModal();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось добавить тур';
  } finally {
    saving.value = false;
  }
}

async function removeTour(tour: Tour) {
  if (!series.value) return;
  if (!window.confirm(`Убрать тур «${tour.title}» из выпуска?`)) return;

  saving.value = true;
  error.value = '';
  try {
    await adminApi(`/series/${series.value.id}/tours/${tour.id}`, {
      method: 'DELETE',
    });
    await load();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось убрать тур';
  } finally {
    saving.value = false;
  }
}

async function moveTour(tour: Tour, direction: -1 | 1) {
  if (!series.value) return;
  const ids = series.value.tours.map((t) => t.id);
  const index = ids.indexOf(tour.id);
  const target = index + direction;
  if (target < 0 || target >= ids.length) return;

  [ids[index], ids[target]] = [ids[target], ids[index]];

  saving.value = true;
  try {
    series.value = await adminApi(`/series/${series.value.id}/tours/order`, {
      method: 'PUT',
      body: JSON.stringify({ tourIds: ids }),
    });
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
  <div>
    <p v-if="loading" class="field-hint">Загрузка…</p>
    <p v-else-if="loadError" class="error">{{ loadError }}</p>

    <template v-else-if="series">
    <h1 class="page-title">Выпуск {{ series.number }}: {{ series.title }}</h1>

    <div class="card">
      <p>Статус: <strong>{{ series.status }}</strong></p>
      <button v-if="series.status !== 'PUBLISHED'" class="btn" style="margin-top: 0.75rem" @click="publish">
        Опубликовать
      </button>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin: 1rem 0">
      <h2>Туры в выпуске</h2>
      <button class="btn" type="button" :disabled="saving" @click="openPickModal">+ Добавить тур</button>
    </div>

    <p v-if="error && !showPickModal" class="error">{{ error }}</p>

    <div v-if="!series.tours.length" class="card">
      <p style="color: #6b7280; margin: 0">
        Туры не выбраны. Добавьте готовые туры из библиотеки или
        <RouterLink to="/tours">создайте новый</RouterLink>.
      </p>
    </div>

    <div v-for="(tour, index) in series.tours" :key="tour.id" class="card">
      <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: space-between">
        <div>
          <h3 style="margin: 0">
            <RouterLink :to="tourQuestionsRoute(tour.id, series.id)">{{ tour.title }}</RouterLink>
          </h3>
          <p style="color: #6b7280; margin: 0.35rem 0 0; font-size: 0.875rem">
            {{ tour.defaultPoints }} б. · ⏱ {{ formatTime(tour.defaultTimeLimitSec) }}
            · {{ tour.questions.length }} заданий
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap">
          <button
            class="btn btn-secondary btn-sm"
            type="button"
            :disabled="index === 0 || saving"
            @click="moveTour(tour, -1)"
          >
            ↑
          </button>
          <button
            class="btn btn-secondary btn-sm"
            type="button"
            :disabled="index === series.tours.length - 1 || saving"
            @click="moveTour(tour, 1)"
          >
            ↓
          </button>
          <button class="btn btn-secondary btn-sm" type="button" :disabled="saving" @click="removeTour(tour)">
            Убрать
          </button>
        </div>
      </div>
      <p v-if="tour.rules" style="color: #6b7280; margin: 0.75rem 0 0">{{ tour.rules }}</p>

      <ul v-if="tour.questions.length" class="question-list">
        <li v-for="q in tour.questions" :key="q.id" class="question-item">
          <div class="question-content">
            <div>{{ q.prompt }}</div>
            <div class="question-meta">
              <span v-if="q.contentType === 'IMAGE_TEXT'">🖼 · </span>
              <span>→ <em>{{ q.correctAnswer }}</em></span>
              <span v-if="q.hints?.length"> · 💡 {{ q.hints.length }}</span>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <AdminModal
      :open="showPickModal"
      title="Добавить тур из библиотеки"
      hide-submit
      :loading="saving"
      @close="closePickModal"
      @submit="closePickModal"
    >
      <p v-if="error" class="error">{{ error }}</p>
      <p class="field-hint" style="margin-top: 0">
        Выберите тур. Редактировать задания можно в разделе
        <RouterLink to="/tours">Туры</RouterLink>.
      </p>

      <div v-if="!availableTours.length" class="empty-pick">
        <p>Нет доступных туров.</p>
        <RouterLink to="/tours" class="btn btn-secondary" @click="closePickModal">
          Создать тур
        </RouterLink>
      </div>

      <ul v-else class="pick-list">
        <li v-for="tour in availableTours" :key="tour.id">
          <button class="pick-item" type="button" :disabled="saving" @click="addTour(tour.id)">
            <strong>{{ tour.title }}</strong>
            <span>{{ tour._count.questions }} заданий · {{ tour.defaultPoints }} б.</span>
          </button>
        </li>
      </ul>
    </AdminModal>
    </template>
  </div>
</template>

<style scoped>
.question-list {
  margin: 0.75rem 0 0;
  padding: 0;
  list-style: none;
}

.question-item {
  padding: 0.5rem 0;
  border-top: 1px solid #e5e7eb;
}

.question-item:first-child {
  border-top: none;
}

.question-meta {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.btn-sm {
  font-size: 0.8125rem;
  padding: 0.35rem 0.65rem;
}

.pick-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.5rem;
}

.pick-item {
  width: 100%;
  text-align: left;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  padding: 0.75rem 1rem;
  cursor: pointer;
  display: grid;
  gap: 0.25rem;
}

.pick-item:hover:not(:disabled) {
  border-color: #4f46e5;
  background: #f5f3ff;
}

.pick-item:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pick-item span {
  font-size: 0.875rem;
  color: #6b7280;
}

.empty-pick {
  display: grid;
  gap: 0.75rem;
}
</style>
