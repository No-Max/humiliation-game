<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { adminApi } from '../lib/api';

interface TourDetail {
  id: string;
  title: string;
  rules?: string | null;
  defaultPoints: number;
  defaultTimeLimitSec: number;
  _count?: { seriesTours: number };
}

const route = useRoute();
const router = useRouter();

const isNew = computed(() => route.path.endsWith('/new'));
const tourId = computed(() => (isNew.value ? null : String(route.params.tourId)));

const loading = ref(true);
const saving = ref(false);
const error = ref('');
const loadError = ref('');

const form = ref({
  title: '',
  rules: '',
  defaultPoints: '3',
  defaultTimeLimitSec: '60',
});

async function loadTour() {
  if (isNew.value || !tourId.value) {
    loading.value = false;
    return;
  }

  loading.value = true;
  loadError.value = '';
  try {
    const tour = await adminApi<TourDetail>(`/tours/${tourId.value}`);
    form.value = {
      title: tour.title,
      rules: tour.rules ?? '',
      defaultPoints: String(tour.defaultPoints),
      defaultTimeLimitSec: String(tour.defaultTimeLimitSec),
    };
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Не удалось загрузить тур';
  } finally {
    loading.value = false;
  }
}

onMounted(loadTour);

function parsePositiveInt(value: string | number, min: number): number | typeof NaN {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return NaN;
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

async function save() {
  const payload = buildPayload();
  const validationError = validatePayload(payload);
  if (validationError) {
    error.value = validationError;
    return;
  }

  saving.value = true;
  error.value = '';
  try {
    if (isNew.value) {
      await adminApi('/tours', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } else if (tourId.value) {
      await adminApi(`/tours/${tourId.value}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }
    router.push('/tours');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка сохранения';
  } finally {
    saving.value = false;
  }
}

async function removeTour() {
  if (isNew.value || !tourId.value) return;
  const title = form.value.title.trim() || 'тур';
  if (!window.confirm(`Удалить тур «${title}»?`)) return;

  saving.value = true;
  error.value = '';
  try {
    await adminApi(`/tours/${tourId.value}`, { method: 'DELETE' });
    router.push('/tours');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось удалить тур';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <p class="back-link">
      <RouterLink to="/tours">← К турам</RouterLink>
    </p>

    <h1 class="page-title">{{ isNew ? 'Новый тур' : 'Редактировать тур' }}</h1>

    <p v-if="loading" class="field-hint">Загрузка…</p>
    <p v-else-if="loadError" class="error">{{ loadError }}</p>

    <div v-else class="card">
      <p v-if="error" class="error">{{ error }}</p>

      <label class="label" for="tour-title">Название</label>
      <input
        id="tour-title"
        v-model="form.title"
        class="input"
        placeholder="Например: Мемы"
        autofocus
      />

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

      <div class="form-actions">
        <button class="btn" type="button" :disabled="saving" @click="save">
          {{ saving ? 'Сохранение…' : isNew ? 'Создать' : 'Сохранить' }}
        </button>
        <RouterLink to="/tours" class="btn btn-secondary">Отмена</RouterLink>
        <button
          v-if="!isNew"
          class="btn btn-danger"
          type="button"
          :disabled="saving"
          @click="removeTour"
        >
          Удалить тур
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.back-link {
  margin-bottom: 0.75rem;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

.btn-danger {
  margin-left: auto;
}
</style>
