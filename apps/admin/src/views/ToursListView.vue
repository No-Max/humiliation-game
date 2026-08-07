<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { adminApi } from '../lib/api';
import AdminModal from '../components/AdminModal.vue';

interface TourRow {
  id: string;
  title: string;
  rules?: string | null;
  defaultPoints: number;
  defaultTimeLimitSec: number;
  _count: { questions: number; seriesTours: number };
}

type ModalMode = 'create' | 'edit' | null;

const tours = ref<TourRow[]>([]);
const loading = ref(true);
const modalMode = ref<ModalMode>(null);
const editingTourId = ref<string | null>(null);
const saving = ref(false);
const error = ref('');

const form = ref({
  title: '',
  rules: '',
  defaultPoints: '3',
  defaultTimeLimitSec: '60',
});

async function loadTours() {
  loading.value = true;
  try {
    tours.value = await adminApi('/tours');
  } finally {
    loading.value = false;
  }
}

onMounted(loadTours);

function resetForm() {
  form.value = {
    title: '',
    rules: '',
    defaultPoints: '3',
    defaultTimeLimitSec: '60',
  };
}

function openCreateModal() {
  editingTourId.value = null;
  resetForm();
  error.value = '';
  modalMode.value = 'create';
}

function openEditModal(tour: TourRow) {
  editingTourId.value = tour.id;
  form.value = {
    title: tour.title,
    rules: tour.rules ?? '',
    defaultPoints: String(tour.defaultPoints),
    defaultTimeLimitSec: String(tour.defaultTimeLimitSec),
  };
  error.value = '';
  modalMode.value = 'edit';
}

function closeModal() {
  modalMode.value = null;
  editingTourId.value = null;
  error.value = '';
}

function parsePositiveInt(value: string | number, min: number, fallback?: number): number | typeof NaN {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return fallback ?? NaN;
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < min) return NaN;
  return n;
}

function buildPayload() {
  const title = String(form.value.title ?? '').trim();
  const defaultPoints = parsePositiveInt(form.value.defaultPoints, 1);
  const defaultTimeLimitSec = parsePositiveInt(form.value.defaultTimeLimitSec, 5);
  return {
    title,
    rules: String(form.value.rules ?? '').trim() || null,
    defaultPoints,
    defaultTimeLimitSec,
  };
}

function validatePayload(payload: ReturnType<typeof buildPayload>): string | null {
  if (!payload.title) return 'Введите название тура';
  if (Number.isNaN(payload.defaultPoints)) return 'Укажите стоимость не менее 1 балла';
  if (Number.isNaN(payload.defaultTimeLimitSec)) return 'Укажите время не менее 5 секунд';
  return null;
}

async function submitModal() {
  const payload = buildPayload();
  const validationError = validatePayload(payload);
  if (validationError) {
    error.value = validationError;
    return;
  }

  saving.value = true;
  error.value = '';
  try {
    if (modalMode.value === 'create') {
      await adminApi('/tours', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } else if (modalMode.value === 'edit' && editingTourId.value) {
      await adminApi(`/tours/${editingTourId.value}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }
    await loadTours();
    closeModal();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка сохранения';
  } finally {
    saving.value = false;
  }
}

async function removeTour() {
  if (!editingTourId.value || modalMode.value !== 'edit') return;
  const tour = tours.value.find((t) => t.id === editingTourId.value);
  if (!tour) return;
  if (!window.confirm(`Удалить тур «${tour.title}»?`)) return;

  saving.value = true;
  error.value = '';
  try {
    await adminApi(`/tours/${editingTourId.value}`, { method: 'DELETE' });
    await loadTours();
    closeModal();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось удалить тур';
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
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem">
      <h1 class="page-title">Туры</h1>
      <button class="btn" type="button" @click="openCreateModal">+ Новый тур</button>
    </div>

    <p class="field-hint" style="margin-top: 0">
      Библиотека туров. Настройте название, правила, время и стоимость — затем добавьте задания и подключите тур к выпуску.
    </p>

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
            <th>Заданий</th>
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
            <td>
              <RouterLink :to="`/tours/${tour.id}/questions`">
                {{ tour._count.questions }}
              </RouterLink>
            </td>
            <td>{{ tour._count.seriesTours }}</td>
            <td>
              <button class="btn btn-secondary btn-sm" type="button" @click="openEditModal(tour)">
                Изменить
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminModal
      v-if="modalMode"
      :open="!!modalMode"
      :title="modalMode === 'create' ? 'Новый тур' : 'Редактировать тур'"
      :submit-label="modalMode === 'create' ? 'Создать' : 'Сохранить'"
      :delete-label="modalMode === 'edit' ? 'Удалить тур' : undefined"
      :loading="saving"
      @close="closeModal"
      @submit="submitModal"
      @delete="removeTour"
    >
      <p v-if="error" class="error">{{ error }}</p>
      <label class="label" for="tour-title">Название</label>
      <input id="tour-title" v-model="form.title" class="input" placeholder="Например: Мемы" autofocus />
      <label class="label" for="tour-rules">Правила</label>
      <textarea
        id="tour-rules"
        v-model="form.rules"
        class="textarea"
        placeholder="Кратко опишите правила тура"
      />
      <label class="label" for="tour-points">Стоимость вопроса (баллы)</label>
      <input id="tour-points" v-model="form.defaultPoints" class="input" type="number" min="1" />
      <label class="label" for="tour-time">Время на ответ (сек)</label>
      <input id="tour-time" v-model="form.defaultTimeLimitSec" class="input" type="number" min="5" />
    </AdminModal>
  </div>
</template>

<style scoped>
.rules-cell {
  max-width: 16rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.btn-sm {
  font-size: 0.8125rem;
  padding: 0.35rem 0.65rem;
}
</style>
