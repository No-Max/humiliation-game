<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { adminApi } from '../lib/api';
import { tourSettingsRoute, tourSettingsNewRoute } from '../lib/tourNavigation';
import AdminIcon from '../components/AdminIcon.vue';

interface TourRow {
  id: string;
  title: string;
  rules?: string | null;
  defaultPoints: number;
  defaultTimeLimitSec: number;
  _count: { seriesTours: number };
}

const tours = ref<TourRow[]>([]);
const loading = ref(true);
const deletingId = ref<string | null>(null);
const error = ref('');

async function loadTours() {
  loading.value = true;
  try {
    tours.value = await adminApi('/tours');
  } finally {
    loading.value = false;
  }
}

onMounted(loadTours);

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m} мин ${s} сек` : `${m} мин`;
}

async function removeTour(tour: TourRow) {
  if (!window.confirm(`Удалить тур «${tour.title}»?`)) return;

  deletingId.value = tour.id;
  error.value = '';
  try {
    await adminApi(`/tours/${tour.id}`, { method: 'DELETE' });
    await loadTours();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось удалить тур';
  } finally {
    deletingId.value = null;
  }
}
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem">
      <h1 class="page-title">Туры</h1>
      <RouterLink :to="tourSettingsNewRoute()" class="btn">
        <AdminIcon name="plus-icon" />
        Новый тур
      </RouterLink>
    </div>

    <p class="field-hint" style="margin-top: 0">
      Библиотека туров. Настройте название, правила, время и стоимость — затем подключите тур к выпуску и добавьте задания там.
    </p>

    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="loading" class="card">Загрузка...</div>
    <div v-else-if="!tours.length" class="card">
      <p>Пока нет туров. Создайте первый.</p>
    </div>
    <div v-else class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Правила</th>
            <th>Стоимость</th>
            <th>Время</th>
            <th>В выпусках</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tour in tours" :key="tour.id">
            <td><strong>{{ tour.title }}</strong></td>
            <td class="rules-cell">{{ tour.rules || '—' }}</td>
            <td>{{ tour.defaultPoints }} б.</td>
            <td>{{ formatTime(tour.defaultTimeLimitSec) }}</td>
            <td>{{ tour._count.seriesTours }}</td>
            <td class="actions-cell">
              <button
                class="btn btn-danger btn-sm"
                type="button"
                :disabled="deletingId === tour.id"
                @click="removeTour(tour)"
              >
                <AdminIcon name="trash-icon" />
                {{ deletingId === tour.id ? 'Удаление…' : 'Удалить' }}
              </button>
              <RouterLink :to="tourSettingsRoute(tour.id)" class="btn btn-secondary btn-sm">
                <AdminIcon name="pencil-icon" />
                Редактировать
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.rules-cell {
  max-width: 16rem;
  color: #6b7280;
  font-size: 0.875rem;
}
</style>
