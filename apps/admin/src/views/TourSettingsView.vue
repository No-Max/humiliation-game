<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { adminApi } from '../lib/api';
import {
  getSeriesIdFromRoute,
  toursBackRoute,
  tourQuestionsRoute,
} from '../lib/tourNavigation';
import AdminIcon from '../components/AdminIcon.vue';
import AdminBreadcrumbs from '../components/AdminBreadcrumbs.vue';
import MediaImagesInput from '../components/MediaImagesInput.vue';
import RichTextEditor from '../components/RichTextEditor.vue';
import { useSeriesBreadcrumb, buildTourContextCrumbs } from '../lib/adminBreadcrumbs';
import { isEmptyRichText } from '../lib/htmlText';

interface TourDetail {
  id: string;
  title: string;
  rules?: string | null;
  mediaUrls?: string[];
  defaultPoints: number;
  defaultTimeLimitSec: number;
  limitQuestionsToTeamCount?: boolean;
  _count?: { seriesTours: number };
}

const route = useRoute();
const router = useRouter();

const isNew = computed(() => route.path.endsWith('/new'));
const tourId = computed(() => (isNew.value ? null : String(route.params.tourId)));
const seriesId = computed(() => getSeriesIdFromRoute(route));
const backRoute = computed(() => toursBackRoute(seriesId.value));
const { seriesMeta } = useSeriesBreadcrumb(seriesId);

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
  limitQuestionsToTeamCount: false,
});

async function loadTour() {
  if (isNew.value || !tourId.value) {
    form.value = {
      title: '',
      mediaUrls: [] as string[],
      rules: '',
      defaultPoints: '3',
      defaultTimeLimitSec: '60',
      limitQuestionsToTeamCount: false,
    };
    loadError.value = '';
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
      limitQuestionsToTeamCount: tour.limitQuestionsToTeamCount ?? false,
    };
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Не удалось загрузить тур';
  } finally {
    loading.value = false;
  }
}

onMounted(loadTour);

watch(
  () => [route.path, route.params.tourId],
  () => {
    void loadTour();
  },
);

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
    limitQuestionsToTeamCount: form.value.limitQuestionsToTeamCount,
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
      const created = await adminApi<{ id: string }>('/tours', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          ...(seriesId.value ? { seriesId: seriesId.value } : {}),
        }),
      });
      if (seriesId.value) {
        router.push(tourQuestionsRoute(created.id, seriesId.value));
      } else {
        router.push('/tours');
      }
    } else if (tourId.value) {
      await adminApi(`/tours/${tourId.value}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      router.push(backRoute.value);
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка сохранения';
  } finally {
    saving.value = false;
  }
}

const breadcrumbs = computed(() => {
  const base = buildTourContextCrumbs(seriesId.value, seriesMeta.value);
  if (isNew.value) {
    return [...base, { label: 'Новый тур' }];
  }
  const title = form.value.title.trim() || (loading.value ? '…' : 'Редактировать тур');
  return [...base, { label: title }];
});
</script>

<template>
  <div>
    <AdminBreadcrumbs :items="breadcrumbs" />

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

      <label class="checkbox-row">
        <input
          id="tour-limit-questions"
          v-model="form.limitQuestionsToTeamCount"
          type="checkbox"
        />
        <span>По одному вопросу на команду</span>
      </label>
      <p class="field-hint tour-limit-hint">
        В игре будет не больше вопросов, чем команд в комнате — каждая команда ответит на один вопрос.
      </p>

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
        <RouterLink :to="backRoute" class="btn btn-secondary">
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

.checkbox-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0.75rem 0 0;
  cursor: pointer;
  font-weight: 500;
}

.checkbox-row input {
  margin-top: 0.2rem;
}

.tour-limit-hint {
  margin-top: 0.35rem;
}

@media (max-width: 720px) {
  .meta-row {
    grid-template-columns: 1fr;
  }
}
</style>
