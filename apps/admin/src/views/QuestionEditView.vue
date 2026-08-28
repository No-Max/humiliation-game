<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { adminApi } from '../lib/api';
import { getSeriesIdFromRoute, tourQuestionsRoute } from '../lib/tourNavigation';
import AnswerMediaInput from '../components/AnswerMediaInput.vue';
import AnswerVariantsInput from '../components/AnswerVariantsInput.vue';
import type { QuestionChoice } from '@humiliation-game/shared';
import { parseQuestionChoices, serializeQuestionChoices } from '@humiliation-game/shared';
import ChoicesInput from '../components/ChoicesInput.vue';
import HintsInput from '../components/HintsInput.vue';
import MediaImagesInput from '../components/MediaImagesInput.vue';
import RichTextEditor from '../components/RichTextEditor.vue';
import AdminIcon from '../components/AdminIcon.vue';
import AdminBreadcrumbs from '../components/AdminBreadcrumbs.vue';
import { isEmptyRichText } from '../lib/htmlText';
import {
  buildTourContextCrumbs,
  crumbTourQuestions,
  useSeriesBreadcrumb,
} from '../lib/adminBreadcrumbs';

type AnswerTypeOption = 'TEXT' | 'CHOICE';
type AnswerMediaType = 'IMAGE' | 'AUDIO' | 'VIDEO';

interface AnswerMediaItem {
  url: string;
  type: AnswerMediaType;
}

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
  answerType?: string;
  choices?: QuestionChoice[] | string[];
  answerMedia?: AnswerMediaItem[] | null;
  answerExplanation?: string | null;
}

interface Tour {
  id: string;
  title: string;
  defaultPoints: number;
  defaultTimeLimitSec: number;
  questions: Question[];
}

const ANSWER_TYPES: { value: AnswerTypeOption; label: string }[] = [
  { value: 'TEXT', label: 'Текстовый ввод' },
  { value: 'CHOICE', label: 'Варианты ответов' },
];

const route = useRoute();
const router = useRouter();

const tourId = computed(() => String(route.params.tourId));
const seriesId = computed(() => getSeriesIdFromRoute(route));
const { seriesMeta } = useSeriesBreadcrumb(seriesId);
const questionId = computed(() =>
  route.params.questionId ? String(route.params.questionId) : null,
);
const isEdit = computed(() => !!questionId.value);

const tour = ref<Tour | null>(null);
const question = ref<Question | null>(null);
const loading = ref(true);
const hydrating = ref(false);
const saving = ref(false);
const error = ref('');
const loadError = ref('');

const form = ref({
  answerType: 'TEXT' as AnswerTypeOption,
  prompt: '',
  mediaUrls: [] as string[],
  correctAnswer: '',
  choices: [] as QuestionChoice[],
  hints: [] as string[],
  acceptableAnswers: [] as string[],
  points: '',
  timeLimitSec: '',
  answerMedia: [] as AnswerMediaItem[],
  answerExplanation: '',
});

const pageTitle = computed(() =>
  isEdit.value ? 'Редактировать задание' : 'Новое задание',
);

const breadcrumbs = computed(() => {
  const items = buildTourContextCrumbs(seriesId.value, seriesMeta.value);
  if (tour.value) {
    items.push(crumbTourQuestions(tourId.value, tour.value.title, seriesId.value));
  } else if (loading.value) {
    items.push({ label: 'Задания' });
  }
  items.push({ label: pageTitle.value });
  return items;
});

const isChoiceAnswer = computed(() => form.value.answerType === 'CHOICE');

function normalizeAnswerType(value?: string): AnswerTypeOption {
  return value === 'CHOICE' ? 'CHOICE' : 'TEXT';
}

function normalizeAnswerMedia(value: unknown): AnswerMediaItem[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(['IMAGE', 'AUDIO', 'VIDEO']);
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const url = typeof (entry as { url?: unknown }).url === 'string'
      ? (entry as { url: string }).url.trim()
      : '';
    const type = (entry as { type?: unknown }).type;
    if (!url || typeof type !== 'string' || !allowed.has(type)) return [];
    return [{ url, type: type as AnswerMediaType }];
  });
}

async function load() {
  loading.value = true;
  hydrating.value = true;
  loadError.value = '';
  try {
    if (!seriesId.value) {
      loadError.value = 'Задания редактируются только в контексте выпуска';
      return;
    }
    const data = await adminApi<Tour>(
      `/tours/${tourId.value}?seriesId=${encodeURIComponent(seriesId.value)}`,
    );
    tour.value = data;
    const foundTour = data;

    if (isEdit.value) {
      const foundQuestion =
        foundTour.questions.find((item) => item.id === questionId.value) ?? null;
      question.value = foundQuestion;
      if (!foundQuestion) {
        loadError.value = 'Задание не найдено';
        return;
      }
      form.value = {
        answerType: normalizeAnswerType(foundQuestion.answerType),
        prompt: foundQuestion.prompt ?? '',
        mediaUrls: [...(foundQuestion.mediaUrls ?? [])],
        correctAnswer: foundQuestion.correctAnswer,
        choices: parseQuestionChoices(foundQuestion.choices),
        hints: [...(foundQuestion.hints ?? [])],
        acceptableAnswers: [...(foundQuestion.acceptableAnswers ?? [])],
        points: foundQuestion.points != null ? String(foundQuestion.points) : '',
        timeLimitSec:
          foundQuestion.timeLimitSec != null ? String(foundQuestion.timeLimitSec) : '',
        answerMedia: normalizeAnswerMedia(foundQuestion.answerMedia),
        answerExplanation: foundQuestion.answerExplanation ?? '',
      };
    } else {
      form.value = {
        answerType: 'TEXT',
        prompt: '',
        mediaUrls: [],
        correctAnswer: '',
        choices: [],
        hints: [],
        acceptableAnswers: [],
        points: '',
        timeLimitSec: '',
        answerMedia: [],
        answerExplanation: '',
      };
    }
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Не удалось загрузить данные';
  } finally {
    loading.value = false;
    await nextTick();
    hydrating.value = false;
  }
}

watch(
  () => [route.params.tourId, route.params.questionId],
  () => {
    void load();
  },
  { immediate: true },
);

watch(
  () => form.value.answerType,
  (type) => {
    if (hydrating.value) return;
    if (type === 'TEXT') {
      form.value.choices = [];
    } else {
      form.value.acceptableAnswers = [];
    }
    form.value.correctAnswer = '';
  },
);

watch(
  () => form.value.choices,
  (choices) => {
    if (hydrating.value) return;
    if (
      form.value.answerType === 'CHOICE' &&
      form.value.correctAnswer &&
      !choices.some((choice) => choice.text === form.value.correctAnswer)
    ) {
      form.value.correctAnswer = '';
    }
  },
  { deep: true },
);

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

function parsePositiveInt(value: string | number, min: number): number | null {
  const trimmed = trimValue(value);
  if (!trimmed) return null;
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < min) return NaN;
  return n;
}

function buildPayload() {
  const points = parsePositiveInt(form.value.points, 1);
  const timeLimitSec = parsePositiveInt(form.value.timeLimitSec, 5);
  const mediaUrls = form.value.mediaUrls;
  const contentType = mediaUrls.length > 0 ? 'IMAGE_TEXT' : 'TEXT';
  const answerType = form.value.answerType;
  const choices = answerType === 'CHOICE'
    ? serializeQuestionChoices(form.value.choices)
    : [];

  const answerMedia = form.value.answerMedia
    .map((item) => ({
      url: item.url.trim(),
      type: item.type,
    }))
    .filter((item) => item.url);

  return {
    contentType,
    prompt: isEmptyRichText(form.value.prompt) ? null : form.value.prompt.trim(),
    mediaUrls: contentType === 'IMAGE_TEXT' ? mediaUrls : [],
    correctAnswer: trimValue(form.value.correctAnswer),
    hints: form.value.hints.map((item) => trimValue(item)).filter(Boolean),
    acceptableAnswers: answerType === 'TEXT'
      ? form.value.acceptableAnswers.map((item) => trimValue(item)).filter(Boolean)
      : [],
    points,
    timeLimitSec,
    answerType,
    choices,
    answerMedia,
    answerExplanation: isEmptyRichText(form.value.answerExplanation)
      ? null
      : form.value.answerExplanation.trim(),
  };
}

function validate(): boolean {
  if (isEmptyRichText(form.value.prompt)) {
    error.value = 'Введите текст задания';
    return false;
  }
  if (form.value.answerType === 'CHOICE') {
    const choices = serializeQuestionChoices(form.value.choices);
    if (choices.length < 2) {
      error.value = 'Добавьте минимум 2 варианта ответа';
      return false;
    }
    const correctAnswer = trimValue(form.value.correctAnswer);
    if (!correctAnswer) {
      error.value = 'Выберите правильный вариант';
      return false;
    }
    if (!choices.some((choice) => choice.text === correctAnswer)) {
      error.value = 'Правильный ответ должен быть одним из вариантов';
      return false;
    }
    const texts = choices.map((choice) => choice.text.trim().toLowerCase());
    if (new Set(texts).size !== texts.length) {
      error.value = 'Варианты ответа не должны повторяться';
      return false;
    }
  } else if (!trimValue(form.value.correctAnswer)) {
    error.value = 'Введите правильный ответ';
    return false;
  }
  const points = parsePositiveInt(form.value.points, 1);
  if (Number.isNaN(points)) {
    error.value = 'Укажите стоимость не менее 1 балла или оставьте пустым';
    return false;
  }
  const timeLimitSec = parsePositiveInt(form.value.timeLimitSec, 5);
  if (Number.isNaN(timeLimitSec)) {
    error.value = 'Укажите время не менее 5 секунд или оставьте пустым';
    return false;
  }
  return true;
}

function goBack() {
  router.push(tourQuestionsRoute(tourId.value, seriesId.value));
}

async function save() {
  if (!tour.value || !validate()) return;
  if (!seriesId.value) {
    error.value = 'Задания можно сохранять только внутри выпуска';
    return;
  }

  saving.value = true;
  error.value = '';

  try {
    const payload = buildPayload();

    if (isEdit.value && question.value) {
      await adminApi(`/tours/questions/${question.value.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...question.value,
          ...payload,
        }),
      });
    } else {
      await adminApi(`/tours/${tour.value.id}/questions`, {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          seriesId: seriesId.value,
          points: payload.points ?? undefined,
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
    await adminApi(`/tours/questions/${question.value.id}`, {
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
    <AdminBreadcrumbs :items="breadcrumbs" />

    <h1 class="page-title">{{ pageTitle }}</h1>

    <p v-if="loading" class="field-hint">Загрузка…</p>
    <p v-else-if="loadError" class="error">{{ loadError }}</p>

    <form v-else-if="tour" class="card question-form" @submit.prevent="save">
      <p class="field-hint" style="margin-top: 0">Тур «{{ tour.title }}»</p>

      <p v-if="error" class="error">{{ error }}</p>

      <section class="form-section">
        <h2 class="form-section-title">Вопрос</h2>

        <div class="meta-row">
          <div class="meta-field">
            <label class="label" for="question-points">Стоимость (баллы)</label>
            <input
              id="question-points"
              v-model="form.points"
              class="input"
              type="number"
              min="1"
              :placeholder="`Дефолт: ${tour.defaultPoints}`"
            />
          </div>
          <div class="meta-field">
            <label class="label" for="question-time">Время на ответ (сек)</label>
            <input
              id="question-time"
              v-model="form.timeLimitSec"
              class="input"
              type="number"
              min="5"
              :placeholder="`Дефолт: ${tour.defaultTimeLimitSec}`"
            />
          </div>
        </div>

        <label class="label" for="question-prompt">Текст задания</label>
        <RichTextEditor
          v-model="form.prompt"
          input-id="question-prompt"
          placeholder="Вопрос или задание"
        />

        <MediaImagesInput v-model="form.mediaUrls" />
      </section>

      <section class="form-section">
        <h2 class="form-section-title">Ответ</h2>

        <div class="meta-field answer-type-field">
          <label class="label" for="answer-type">Тип ответа</label>
          <select id="answer-type" v-model="form.answerType" class="select">
            <option v-for="option in ANSWER_TYPES" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <template v-if="isChoiceAnswer">
          <ChoicesInput v-model="form.choices" />

          <label class="label" for="question-choice-answer">Правильный вариант</label>
          <select
            id="question-choice-answer"
            v-model="form.correctAnswer"
            class="select"
            :disabled="form.choices.length === 0"
          >
            <option value="" disabled>Выберите правильный ответ</option>
            <option v-for="choice in form.choices" :key="choice.text" :value="choice.text">
              {{ choice.text }}
            </option>
          </select>
        </template>

        <template v-else>
          <label class="label" for="question-answer">Основной правильный ответ</label>
          <input
            id="question-answer"
            v-model="form.correctAnswer"
            class="input"
            placeholder="Главный вариант ответа"
          />

          <AnswerVariantsInput v-model="form.acceptableAnswers" />
        </template>

        <AnswerMediaInput v-model="form.answerMedia" />

        <label class="label" for="question-answer-explanation">Пояснение к ответу</label>
        <RichTextEditor
          v-model="form.answerExplanation"
          input-id="question-answer-explanation"
          placeholder="Дополнительный комментарий, который увидят игроки после ответа"
        />

        <HintsInput v-model="form.hints" />
      </section>

      <div class="form-actions">
        <button
          v-if="isEdit"
          class="btn btn-danger"
          type="button"
          :disabled="saving"
          @click="remove"
        >
          <AdminIcon name="trash-icon" />
          Удалить
        </button>
        <div class="form-actions-main">
          <button class="btn btn-secondary" type="button" :disabled="saving" @click="goBack">
            <AdminIcon name="close-icon" />
            Отмена
          </button>
          <button class="btn" type="submit" :disabled="saving">
            <AdminIcon :name="isEdit ? 'check-icon' : 'plus-icon'" />
            {{ saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.question-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.form-section {
  padding: 1.25rem 0;
  border-top: 1px solid #e5e7eb;
}

.form-section:first-of-type {
  padding-top: 0;
  border-top: none;
}

.form-section-title {
  margin: 0 0 1rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.meta-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem 1rem;
  margin-bottom: 0.75rem;
}

.meta-field .input,
.meta-field .select {
  margin-bottom: 0;
}

.answer-type-field {
  max-width: 20rem;
  margin-bottom: 0.75rem;
}

@media (max-width: 720px) {
  .meta-row {
    grid-template-columns: 1fr;
  }
}
</style>
