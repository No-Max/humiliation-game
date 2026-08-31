<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { formatQuestionCount } from '@humiliation-game/shared';
import { adminApi } from '../lib/api';
import AdminModal from '../components/AdminModal.vue';
import AdminIcon from '../components/AdminIcon.vue';
import AdminBreadcrumbs from '../components/AdminBreadcrumbs.vue';
import RichTextEditor from '../components/RichTextEditor.vue';
import { crumbSeriesList } from '../lib/adminBreadcrumbs';
import { isEmptyRichText } from '../lib/htmlText';
import { tourQuestionsRoute, tourSettingsNewRoute } from '../lib/tourNavigation';

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

interface SeriesListItem {
  id: string;
  title: string;
  number: number;
  status: string;
}

const route = useRoute();
const router = useRouter();
const series = ref<SeriesDetail | null>(null);
const libraryTours = ref<TourLibraryItem[]>([]);
const allSeries = ref<SeriesListItem[]>([]);
const showPickModal = ref(false);
const showMoveModal = ref(false);
const tourToMove = ref<Tour | null>(null);
const saving = ref(false);
const error = ref('');
const loading = ref(true);
const loadError = ref('');
const detailsSaving = ref(false);
const detailsError = ref('');
const statusUpdating = ref(false);
const detailsOpen = ref(false);

const detailsForm = ref({
  title: '',
  description: '',
});

function syncDetailsForm() {
  if (!series.value) return;
  detailsForm.value = {
    title: series.value.title,
    description: series.value.description ?? '',
  };
}

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
    syncDetailsForm();
  } catch (e) {
    series.value = null;
    loadError.value = e instanceof Error ? e.message : 'Не удалось загрузить выпуск';
  } finally {
    loading.value = false;
  }
}

onMounted(load);

watch(
  () => route.params.id,
  () => {
    void load();
  },
);

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

const otherSeries = computed(() =>
  allSeries.value.filter((item) => item.id !== series.value?.id),
);

async function openMoveModal(tour: Tour) {
  allSeries.value = await adminApi('/series');
  tourToMove.value = tour;
  error.value = '';
  showMoveModal.value = true;
}

function closeMoveModal() {
  showMoveModal.value = false;
  tourToMove.value = null;
  error.value = '';
}

async function moveTourToSeries(targetSeriesId: string) {
  if (!series.value || !tourToMove.value) return;

  const target = allSeries.value.find((item) => item.id === targetSeriesId);
  if (!target) return;

  const questionCount = tourToMove.value.questions.length;
  const questionLabel = formatQuestionCount(questionCount);
  if (
    !window.confirm(
      `Переместить тур «${tourToMove.value.title}» (${questionLabel}) в выпуск ${target.number}: «${target.title}»?`,
    )
  ) {
    return;
  }

  saving.value = true;
  error.value = '';
  try {
    await adminApi(`/series/${series.value.id}/tours/${tourToMove.value.id}/move`, {
      method: 'POST',
      body: JSON.stringify({ targetSeriesId }),
    });
    closeMoveModal();
    await router.push(`/series/${targetSeriesId}`);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось переместить тур';
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

function statusLabel(status: string) {
  return status === 'PUBLISHED' ? 'Опубликован' : 'Черновик';
}

function buildDetailsPayload(status: string) {
  const title = detailsForm.value.title.trim();
  return {
    title,
    number: series.value!.number,
    description: isEmptyRichText(detailsForm.value.description)
      ? null
      : detailsForm.value.description.trim(),
    status,
  };
}

async function saveDetails() {
  if (!series.value) return;

  const title = detailsForm.value.title.trim();
  if (!title) {
    detailsError.value = 'Введите название выпуска';
    detailsOpen.value = true;
    return;
  }

  detailsSaving.value = true;
  detailsError.value = '';
  try {
    await adminApi(`/series/${series.value.id}`, {
      method: 'PUT',
      body: JSON.stringify(buildDetailsPayload(series.value.status)),
    });
    await load();
  } catch (e) {
    detailsError.value = e instanceof Error ? e.message : 'Не удалось сохранить выпуск';
  } finally {
    detailsSaving.value = false;
  }
}

async function updateStatus(status: 'DRAFT' | 'PUBLISHED') {
  if (!series.value) return;

  const title = detailsForm.value.title.trim();
  if (!title) {
    detailsError.value = 'Введите название выпуска';
    detailsOpen.value = true;
    return;
  }
  if (status === 'DRAFT' && !window.confirm(`Снять выпуск «${title}» с публикации?`)) return;

  statusUpdating.value = true;
  detailsError.value = '';
  try {
    await adminApi(`/series/${series.value.id}`, {
      method: 'PUT',
      body: JSON.stringify(buildDetailsPayload(status)),
    });
    await load();
  } catch (e) {
    detailsError.value = e instanceof Error ? e.message : 'Не удалось изменить статус';
  } finally {
    statusUpdating.value = false;
  }
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m} мин ${s} сек` : `${m} мин`;
}

const breadcrumbs = computed(() => {
  const items = [crumbSeriesList()];
  if (series.value) {
    items.push({ label: `Выпуск ${series.value.number}: ${series.value.title}` });
  } else if (loading.value) {
    items.push({ label: '…' });
  }
  return items;
});
</script>

<template>
  <div>
    <AdminBreadcrumbs :items="breadcrumbs" />

    <p v-if="loading" class="field-hint">Загрузка…</p>
    <p v-else-if="loadError" class="error">{{ loadError }}</p>

    <template v-else-if="series">
    <h1 class="page-title">Выпуск {{ series.number }}: {{ series.title }}</h1>

    <div class="series-toolbar">
      <button
        class="btn btn-secondary btn-sm"
        type="button"
        :aria-expanded="detailsOpen"
        @click="detailsOpen = !detailsOpen"
      >
        <AdminIcon name="pencil-icon" />
        {{ detailsOpen ? 'Свернуть' : 'Редактировать' }}
      </button>
      <span class="field-hint series-status-inline">Статус: {{ statusLabel(series.status) }}</span>
    </div>

    <div v-show="detailsOpen" class="card series-details-card">
      <p v-if="detailsError" class="error">{{ detailsError }}</p>

      <label class="label" for="series-edit-title">Название</label>
      <input
        id="series-edit-title"
        v-model="detailsForm.title"
        class="input"
        placeholder="Название выпуска"
      />

      <label class="label" for="series-edit-description">Описание</label>
      <RichTextEditor
        v-model="detailsForm.description"
        input-id="series-edit-description"
        placeholder="Краткое описание для страницы выпусков"
      />

      <div class="form-actions">
        <button
          v-if="series.status !== 'PUBLISHED'"
          class="btn btn-success"
          type="button"
          :disabled="statusUpdating || detailsSaving || saving"
          @click="updateStatus('PUBLISHED')"
        >
          <AdminIcon name="publish-icon" />
          {{ statusUpdating ? 'Сохранение…' : 'Опубликовать' }}
        </button>
        <button
          v-else
          class="btn btn-warning"
          type="button"
          :disabled="statusUpdating || detailsSaving || saving"
          @click="updateStatus('DRAFT')"
        >
          <AdminIcon name="unpublish-icon" />
          {{ statusUpdating ? 'Сохранение…' : 'Снять с публикации' }}
        </button>
        <div class="form-actions-main">
          <button
            class="btn"
            type="button"
            :disabled="detailsSaving || statusUpdating || saving"
            @click="saveDetails"
          >
            <AdminIcon name="check-icon" />
            {{ detailsSaving ? 'Сохранение…' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin: 1rem 0">
      <h2>Туры в выпуске</h2>
      <div class="actions-cell">
        <RouterLink :to="tourSettingsNewRoute(series.id)" class="btn btn-secondary">
          <AdminIcon name="plus-icon" />
          Новый тур
        </RouterLink>
        <button class="btn" type="button" :disabled="saving" @click="openPickModal">
          <AdminIcon name="plus-icon" />
          Из библиотеки
        </button>
      </div>
    </div>

    <p v-if="error && !showPickModal && !showMoveModal" class="error">{{ error }}</p>

    <div v-if="!series.tours.length" class="card">
      <p style="color: #6b7280; margin: 0">
        Туры не выбраны. Добавьте готовые туры из библиотеки или
        <RouterLink :to="tourSettingsNewRoute(series.id)" class="text-link">создайте новый</RouterLink>
        — он сразу привяжется к этому выпуску.
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
            title="Поднять выше"
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
            title="Опустить ниже"
          >
            <AdminIcon name="arrow-down-icon" />
          </button>
          <button class="btn btn-danger btn-sm" type="button" :disabled="saving" @click="removeTour(tour)" aria-label="Удалить" title="Удалить">
            <AdminIcon name="trash-icon" />
          </button>
          <button class="btn btn-secondary btn-sm" type="button" :disabled="saving" @click="openMoveModal(tour)" aria-label="Переместить" title="Переместить">
            <AdminIcon name="arrow-right-icon" />
          </button>
          <RouterLink :to="tourQuestionsRoute(tour.id, series.id)" class="btn btn-secondary btn-sm">
            <AdminIcon name="pencil-icon" />
            Редактировать
          </RouterLink>
        </div>
      </div>
    </div>

    <AdminModal
      :open="showMoveModal"
      :title="tourToMove ? `Переместить «${tourToMove.title}»` : 'Переместить тур'"
      hide-submit
      :loading="saving"
      @close="closeMoveModal"
      @submit="closeMoveModal"
    >
      <p v-if="error" class="error">{{ error }}</p>
      <p class="field-hint" style="margin-top: 0">
        Выберите выпуск, в который нужно перенести тур вместе с его заданиями.
      </p>

      <div v-if="!otherSeries.length" class="empty-pick">
        <p>Нет других выпусков для перемещения.</p>
      </div>

      <ul v-else class="pick-list">
        <li v-for="item in otherSeries" :key="item.id">
          <button
            class="pick-item"
            type="button"
            :disabled="saving"
            @click="moveTourToSeries(item.id)"
          >
            <strong>Выпуск {{ item.number }}: {{ item.title }}</strong>
            <span>{{ item.status === 'PUBLISHED' ? 'Опубликован' : 'Черновик' }}</span>
          </button>
        </li>
      </ul>
    </AdminModal>

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
        Выберите тур для добавления в выпуск. В выпуск попадёт копия тура без заданий — их нужно будет добавить отдельно.
      </p>

      <div v-if="!availableTours.length" class="empty-pick">
        <p>Нет доступных туров.</p>
        <RouterLink
          :to="tourSettingsNewRoute(series.id)"
          class="btn btn-secondary"
          @click="closePickModal"
        >
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
.series-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.series-status-inline {
  margin: 0;
}

.series-details-card {
  margin-bottom: 1rem;
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
