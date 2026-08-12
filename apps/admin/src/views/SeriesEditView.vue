<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { formatQuestionCount } from '@humiliation-game/shared';
import { adminApi } from '../lib/api';
import AdminModal from '../components/AdminModal.vue';
import AdminIcon from '../components/AdminIcon.vue';
import { tourQuestionsRoute } from '../lib/tourNavigation';

interface Tour {
  id: string;
  title: string;
  rules?: string;
  defaultPoints: number;
  defaultTimeLimitSec: number;
  sortOrder: number;
  questions: { id: string }[];
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
  if (!window.confirm(`Удалить тур «${tour.title}» из выпуска?`)) return;

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

    <div style="display: flex; justify-content: space-between; align-items: center; margin: 1rem 0">
      <h2>Туры в выпуске</h2>
      <button class="btn" type="button" :disabled="saving" @click="openPickModal">
        <AdminIcon name="plus-icon" />
        Добавить тур
      </button>
    </div>

    <p v-if="error && !showPickModal" class="error">{{ error }}</p>

    <div v-if="!series.tours.length" class="card">
      <p style="color: #6b7280; margin: 0">
        Туры не выбраны. Добавьте готовые туры из библиотеки или
        <RouterLink to="/tours" class="text-link">создайте новый</RouterLink>.
      </p>
    </div>

    <div v-for="(tour, index) in series.tours" :key="tour.id" class="card">
      <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: space-between">
        <div>
          <h3 style="margin: 0">{{ tour.title }}</h3>
          <p style="color: #6b7280; margin: 0.35rem 0 0; font-size: 0.875rem">
            {{ tour.defaultPoints }} б. · ⏱ {{ formatTime(tour.defaultTimeLimitSec) }}
            · {{ formatQuestionCount(tour.questions.length) }}
          </p>
        </div>
        <div class="actions-cell">
          <button
            class="btn btn-secondary btn-sm btn-icon"
            type="button"
            aria-label="Поднять выше"
            :disabled="index === 0 || saving"
            @click="moveTour(tour, -1)"
          >
            <AdminIcon name="arrow-up-icon" />
          </button>
          <button
            class="btn btn-secondary btn-sm btn-icon"
            type="button"
            aria-label="Опустить ниже"
            :disabled="index === series.tours.length - 1 || saving"
            @click="moveTour(tour, 1)"
          >
            <AdminIcon name="arrow-down-icon" />
          </button>
          <button class="btn btn-danger btn-sm" type="button" :disabled="saving" @click="removeTour(tour)">
            <AdminIcon name="trash-icon" />
            Удалить
          </button>
          <RouterLink :to="tourQuestionsRoute(tour.id, series.id)" class="btn btn-secondary btn-sm">
            <AdminIcon name="pencil-icon" />
            Редактировать
          </RouterLink>
        </div>
      </div>
      <p v-if="tour.rules" style="color: #6b7280; margin: 0.75rem 0 0">{{ tour.rules }}</p>
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
        Выберите тур для добавления в выпуск.
      </p>

      <div v-if="!availableTours.length" class="empty-pick">
        <p>Нет доступных туров.</p>
        <RouterLink to="/tours" class="btn btn-secondary" @click="closePickModal">
          <AdminIcon name="plus-icon" />
          Создать тур
        </RouterLink>
      </div>

      <ul v-else class="pick-list">
        <li v-for="tour in availableTours" :key="tour.id">
          <button class="pick-item" type="button" :disabled="saving" @click="addTour(tour.id)">
            <strong>{{ tour.title }}</strong>
            <span>{{ tour.defaultPoints }} б. · ⏱ {{ formatTime(tour.defaultTimeLimitSec) }}</span>
          </button>
        </li>
      </ul>
    </AdminModal>
    </template>
  </div>
</template>

<style scoped>
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
