<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { adminApi } from '../lib/api';
import AnswerVariantsInput from '../components/AnswerVariantsInput.vue';
import HintsInput from '../components/HintsInput.vue';
import MediaImagesInput from '../components/MediaImagesInput.vue';

type ContentTypeOption = 'TEXT' | 'IMAGE_TEXT';

interface Question {
  id: string;
  prompt?: string;
  sortOrder: number;
  correctAnswer: string;
  hints?: string[];
  acceptableAnswers?: string[];
  timeLimitSec?: number | null;
  contentType?: string;
  mediaUrls?: string[];
  answerType?: string;
}

interface Tour {
  id: string;
  title: string;
  defaultTimeLimitSec: number;
  questions: Question[];
}

interface SeriesDetail {
  id: string;
  title: string;
  number: number;
  tours: Tour[];
}

const CONTENT_TYPES: { value: ContentTypeOption; label: string }[] = [
  { value: 'TEXT', label: 'Текст' },
  { value: 'IMAGE_TEXT', label: 'Текст + картинка' },
];

const route = useRoute();
const router = useRouter();

const seriesId = computed(() => String(route.params.seriesId));
const tourId = computed(() => String(route.params.tourId));
const questionId = computed(() =>
  route.params.questionId ? String(route.params.questionId) : null,
);
const isEdit = computed(() => !!questionId.value);

const series = ref<SeriesDetail | null>(null);
const tour = ref<Tour | null>(null);
const question = ref<Question | null>(null);
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const loadError = ref('');

const form = ref({
  contentType: 'TEXT' as ContentTypeOption,
  prompt: '',
  mediaUrls: [] as string[],
  correctAnswer: '',
  hints: [] as string[],
  acceptableAnswers: [] as string[],
  timeLimitSec: '',
});

const pageTitle = computed(() =>
  isEdit.value ? 'Редактировать задание' : 'Новое задание',
);

const showImages = computed(() => form.value.contentType === 'IMAGE_TEXT');

function normalizeContentType(value?: string): ContentTypeOption {
  return value === 'IMAGE_TEXT' ? 'IMAGE_TEXT' : 'TEXT';
}

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    const data = await adminApi<SeriesDetail>(`/series/${seriesId.value}`);
    series.value = data;
    const foundTour = data.tours.find((item) => item.id === tourId.value) ?? null;
    tour.value = foundTour;

    if (!foundTour) {
      loadError.value = 'Тур не найден';
      return;
    }

    if (isEdit.value) {
      const foundQuestion =
        foundTour.questions.find((item) => item.id === questionId.value) ?? null;
      question.value = foundQuestion;
      if (!foundQuestion) {
        loadError.value = 'Задание не найдено';
        return;
      }
      form.value = {
        contentType: normalizeContentType(foundQuestion.contentType),
        prompt: foundQuestion.prompt ?? '',
        mediaUrls: [...(foundQuestion.mediaUrls ?? [])],
        correctAnswer: foundQuestion.correctAnswer,
        hints: [...(foundQuestion.hints ?? [])],
        acceptableAnswers: [...(foundQuestion.acceptableAnswers ?? [])],
        timeLimitSec:
          foundQuestion.timeLimitSec != null ? String(foundQuestion.timeLimitSec) : '',
      };
    } else {
      form.value = {
        contentType: 'TEXT',
        prompt: '',
        mediaUrls: [],
        correctAnswer: '',
        hints: [],
        acceptableAnswers: [],
        timeLimitSec: '',
      };
    }
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Не удалось загрузить данные';
  } finally {
    loading.value = false;
  }
}

watch(
  () => [route.params.seriesId, route.params.tourId, route.params.questionId],
  () => {
    void load();
  },
  { immediate: true },
);

watch(
  () => form.value.contentType,
  (type) => {
    if (type === 'TEXT') {
      form.value.mediaUrls = [];
    }
  },
);

function parseTimeLimit(value: string, min = 5): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const sec = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(sec) || sec < min) return NaN;
  return sec;
}

function buildPayload() {
  const parsed = parseTimeLimit(form.value.timeLimitSec);
  const contentType = form.value.contentType;
  return {
    contentType,
    prompt: form.value.prompt.trim() || null,
    mediaUrls: contentType === 'IMAGE_TEXT' ? form.value.mediaUrls : [],
    correctAnswer: form.value.correctAnswer.trim(),
    hints: form.value.hints.map((item) => item.trim()).filter(Boolean),
    acceptableAnswers: form.value.acceptableAnswers
      .map((item) => item.trim())
      .filter(Boolean),
    timeLimitSec: parsed,
    answerType: 'TEXT',
  };
}

function validate(): boolean {
  if (!form.value.prompt.trim()) {
    error.value = 'Введите текст задания';
    return false;
  }
  if (form.value.contentType === 'IMAGE_TEXT' && form.value.mediaUrls.length === 0) {
    error.value = 'Загрузите хотя бы одну картинку';
    return false;
  }
  if (!form.value.correctAnswer.trim()) {
    error.value = 'Введите правильный ответ';
    return false;
  }
  const parsed = parseTimeLimit(form.value.timeLimitSec);
  if (Number.isNaN(parsed)) {
    error.value = 'Укажите время не менее 5 секунд или оставьте пустым';
    return false;
  }
  return true;
}

function goBack() {
  router.push(`/series/${seriesId.value}`);
}

async function save() {
  if (!tour.value || !validate()) return;

  saving.value = true;
  error.value = '';

  try {
    const payload = buildPayload();

    if (isEdit.value && question.value) {
      await adminApi(`/series/questions/${question.value.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...question.value,
          ...payload,
        }),
      });
    } else {
      await adminApi(`/series/tours/${tour.value.id}/questions`, {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          timeLimitSec: payload.timeLimitSec ?? undefined,
        }),
      });
    }

    goBack();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка сохранения';
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!question.value || !isEdit.value) return;
  if (!window.confirm('Удалить это задание?')) return;

  saving.value = true;
  error.value = '';
  try {
    await adminApi(`/series/questions/${question.value.id}`, {
      method: 'DELETE',
    });
    goBack();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка удаления';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <p class="back-link">
      <RouterLink :to="`/series/${seriesId}`">← К выпуску</RouterLink>
    </p>

    <h1 class="page-title">{{ pageTitle }}</h1>

    <p v-if="loading" class="field-hint">Загрузка…</p>
    <p v-else-if="loadError" class="error">{{ loadError }}</p>

    <form v-else-if="tour && series" class="card" @submit.prevent="save">
      <p class="field-hint" style="margin-top: 0">
        Выпуск {{ series.number }}: {{ series.title }} · тур «{{ tour.title }}»
      </p>

      <p v-if="error" class="error">{{ error }}</p>

      <label class="label" for="question-type">Тип задания</label>
      <select id="question-type" v-model="form.contentType" class="select">
        <option v-for="option in CONTENT_TYPES" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>

      <label class="label" for="question-prompt">Текст задания</label>
      <textarea
        id="question-prompt"
        v-model="form.prompt"
        class="textarea"
        placeholder="Вопрос или задание"
        autofocus
      />

      <MediaImagesInput v-if="showImages" v-model="form.mediaUrls" />

      <label class="label" for="question-answer">Основной правильный ответ</label>
      <input
        id="question-answer"
        v-model="form.correctAnswer"
        class="input"
        placeholder="Главный вариант ответа"
      />

      <AnswerVariantsInput v-model="form.acceptableAnswers" />
      <HintsInput v-model="form.hints" />

      <label class="label" for="question-time">Время на ответ (сек)</label>
      <input
        id="question-time"
        v-model="form.timeLimitSec"
        class="input"
        type="number"
        min="5"
        placeholder="Пусто = дефолт тура"
      />
      <p class="field-hint">
        Пусто — использовать дефолт тура ({{ tour.defaultTimeLimitSec }} сек)
      </p>

      <div class="form-actions">
        <button
          v-if="isEdit"
          class="btn btn-danger"
          type="button"
          :disabled="saving"
          @click="remove"
        >
          Удалить
        </button>
        <div class="form-actions-main">
          <button class="btn btn-secondary" type="button" :disabled="saving" @click="goBack">
            Отмена
          </button>
          <button class="btn" type="submit" :disabled="saving">
            {{ saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.back-link {
  margin-bottom: 0.75rem;
}

.back-link a {
  color: #4f46e5;
  text-decoration: none;
}

.back-link a:hover {
  text-decoration: underline;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
}

.form-actions-main {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}
</style>
