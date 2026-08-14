<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { adminApi } from '../lib/api';
import AdminIcon from '../components/AdminIcon.vue';
import MediaImagesInput from '../components/MediaImagesInput.vue';
import RichTextEditor from '../components/RichTextEditor.vue';
import { isEmptyRichText } from '../lib/htmlText';

interface TourDetail {
  id: string;
  title: string;
  rules?: string | null;
  mediaUrls?: string[];
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
  mediaUrls: [] as string[],
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
      mediaUrls: [...(tour.mediaUrls ?? [])],
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
    mediaUrls: form.value.mediaUrls,
    rules: isEmptyRichText(form.value.rules) ? null : form.value.rules.trim(),
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
</script>

<template>
  <div>
    <p class="back-link">
      <RouterLink to="/tours">
        <AdminIcon name="arrow-left-icon" />
        К турам
      </RouterLink>
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

      <div class="meta-row">
        <div class="meta-field">
          <label class="label" for="tour-points">Стоимость вопроса (баллы)</label>
          <input id="tour-points" v-model="form.defaultPoints" class="input" type="number" min="1" />
        </div>
        <div class="meta-field">
          <label class="label" for="tour-time">Время на ответ (сек)</label>
          <input id="tour-time" v-model="form.defaultTimeLimitSec" class="input" type="number" min="5" />
        </div>
      </div>

      <MediaImagesInput v-model="form.mediaUrls" />

      <label class="label" for="tour-rules">Правила</label>
      <RichTextEditor
        v-model="form.rules"
        input-id="tour-rules"
        placeholder="Опишите правила тура: списки, абзацы, выделение текста"
      />

      <div class="form-actions">
        <button class="btn" type="button" :disabled="saving" @click="save">
          <AdminIcon :name="isNew ? 'plus-icon' : 'check-icon'" />
          {{ saving ? 'Сохранение…' : isNew ? 'Создать' : 'Сохранить' }}
        </button>
        <RouterLink to="/tours" class="btn btn-secondary">
          <AdminIcon name="close-icon" />
          Отмена
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.meta-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem 1rem;
  margin-bottom: 0.75rem;
}

.meta-field .input {
  margin-bottom: 0;
}

@media (max-width: 720px) {
  .meta-row {
    grid-template-columns: 1fr;
  }
}
</style>
