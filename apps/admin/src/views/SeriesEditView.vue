<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { adminApi } from '../lib/api';
import AdminModal from '../components/AdminModal.vue';

interface Question {
  id: string;
  prompt?: string;
  sortOrder: number;
  correctAnswer: string;
  timeLimitSec?: number | null;
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

type ModalKind = 'addTour' | 'editTourTime' | 'addQuestion' | 'editQuestionTime';

const route = useRoute();
const series = ref<SeriesDetail | null>(null);
const modalKind = ref<ModalKind | null>(null);
const activeTour = ref<Tour | null>(null);
const activeQuestion = ref<Question | null>(null);
const saving = ref(false);
const error = ref('');

const form = ref({
  title: '',
  defaultTimeLimitSec: '60',
  prompt: '',
  correctAnswer: '',
  timeLimitSec: '',
});

async function load() {
  series.value = await adminApi(`/series/${route.params.id}`);
}

onMounted(load);

function closeModal() {
  modalKind.value = null;
  activeTour.value = null;
  activeQuestion.value = null;
  error.value = '';
}

function openAddTour() {
  form.value = { title: '', defaultTimeLimitSec: '60', prompt: '', correctAnswer: '', timeLimitSec: '' };
  error.value = '';
  modalKind.value = 'addTour';
}

function openEditTourTime(tour: Tour) {
  activeTour.value = tour;
  form.value = {
    title: '',
    defaultTimeLimitSec: String(tour.defaultTimeLimitSec),
    prompt: '',
    correctAnswer: '',
    timeLimitSec: '',
  };
  error.value = '';
  modalKind.value = 'editTourTime';
}

function openAddQuestion(tour: Tour) {
  activeTour.value = tour;
  form.value = {
    title: '',
    defaultTimeLimitSec: '60',
    prompt: '',
    correctAnswer: '',
    timeLimitSec: '',
  };
  error.value = '';
  modalKind.value = 'addQuestion';
}

function openEditQuestionTime(tour: Tour, question: Question) {
  activeTour.value = tour;
  activeQuestion.value = question;
  form.value = {
    title: '',
    defaultTimeLimitSec: '60',
    prompt: '',
    correctAnswer: '',
    timeLimitSec: question.timeLimitSec != null ? String(question.timeLimitSec) : '',
  };
  error.value = '';
  modalKind.value = 'editQuestionTime';
}

const modalTitle = {
  addTour: 'Новый тур',
  editTourTime: 'Время на ответ — тур',
  addQuestion: 'Новое задание',
  editQuestionTime: 'Время на ответ — задание',
} as const;

async function publish() {
  if (!series.value) return;
  await adminApi(`/series/${series.value.id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...series.value, status: 'PUBLISHED' }),
  });
  await load();
}

function parseTimeLimit(value: string, min = 5): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const sec = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(sec) || sec < min) return NaN;
  return sec;
}

async function submitModal() {
  if (!series.value || !modalKind.value) return;

  saving.value = true;
  error.value = '';

  try {
    if (modalKind.value === 'addTour') {
      const title = form.value.title.trim();
      if (!title) {
        error.value = 'Введите название тура';
        return;
      }
      const defaultTimeLimitSec = parseTimeLimit(form.value.defaultTimeLimitSec) ?? 60;
      if (Number.isNaN(defaultTimeLimitSec)) {
        error.value = 'Укажите время не менее 5 секунд';
        return;
      }

      await adminApi(`/series/${series.value.id}/tours`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          sortOrder: series.value.tours.length,
          defaultTimeLimitSec,
        }),
      });
    }

    if (modalKind.value === 'editTourTime' && activeTour.value) {
      const defaultTimeLimitSec = parseTimeLimit(form.value.defaultTimeLimitSec);
      if (defaultTimeLimitSec == null || Number.isNaN(defaultTimeLimitSec)) {
        error.value = 'Укажите время не менее 5 секунд';
        return;
      }

      await adminApi(`/series/tours/${activeTour.value.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...activeTour.value, defaultTimeLimitSec }),
      });
    }

    if (modalKind.value === 'addQuestion' && activeTour.value) {
      const prompt = form.value.prompt.trim();
      const correctAnswer = form.value.correctAnswer.trim();
      if (!prompt) {
        error.value = 'Введите текст задания';
        return;
      }
      if (!correctAnswer) {
        error.value = 'Введите правильный ответ';
        return;
      }

      const parsed = parseTimeLimit(form.value.timeLimitSec);
      if (Number.isNaN(parsed)) {
        error.value = 'Укажите время не менее 5 секунд или оставьте пустым';
        return;
      }

      await adminApi(`/series/tours/${activeTour.value.id}/questions`, {
        method: 'POST',
        body: JSON.stringify({
          prompt,
          correctAnswer,
          contentType: 'TEXT',
          answerType: 'TEXT',
          timeLimitSec: parsed ?? undefined,
        }),
      });
    }

    if (modalKind.value === 'editQuestionTime' && activeTour.value && activeQuestion.value) {
      const parsed = parseTimeLimit(form.value.timeLimitSec, 5);
      if (form.value.timeLimitSec.trim() && Number.isNaN(parsed)) {
        error.value = 'Укажите время не менее 5 секунд или оставьте пустым';
        return;
      }

      await adminApi(`/series/questions/${activeQuestion.value.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...activeQuestion.value,
          timeLimitSec: parsed,
        }),
      });
    }

    await load();
    closeModal();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка сохранения';
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
  <div v-if="series">
    <h1 class="page-title">Выпуск {{ series.number }}: {{ series.title }}</h1>

    <div class="card">
      <p>Статус: <strong>{{ series.status }}</strong></p>
      <button v-if="series.status !== 'PUBLISHED'" class="btn" style="margin-top: 0.75rem" @click="publish">
        Опубликовать
      </button>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin: 1rem 0">
      <h2>Туры</h2>
      <button class="btn" type="button" @click="openAddTour">+ Тур</button>
    </div>

    <div v-for="tour in series.tours" :key="tour.id" class="card">
      <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: space-between">
        <h3 style="margin: 0">
          {{ tour.title }} ({{ tour.defaultPoints }} б.)
        </h3>
        <button class="btn btn-secondary" type="button" @click="openEditTourTime(tour)">
          ⏱ {{ formatTime(tour.defaultTimeLimitSec) }}
        </button>
      </div>
      <p v-if="tour.rules" style="color: #6b7280; margin: 0.5rem 0">{{ tour.rules }}</p>

      <ul style="margin: 0.75rem 0; padding-left: 0; list-style: none">
        <li
          v-for="q in tour.questions"
          :key="q.id"
          style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: baseline; margin-bottom: 0.5rem"
        >
          <span style="flex: 1">
            {{ q.prompt }} → <em>{{ q.correctAnswer }}</em>
          </span>
          <button
            class="btn btn-secondary"
            type="button"
            style="font-size: 0.75rem; padding: 0.25rem 0.5rem"
            @click="openEditQuestionTime(tour, q)"
          >
            ⏱ {{ formatTime(q.timeLimitSec ?? tour.defaultTimeLimitSec) }}
          </button>
        </li>
      </ul>

      <button class="btn" type="button" @click="openAddQuestion(tour)">+ Задание</button>
    </div>

    <AdminModal
      v-if="modalKind"
      :open="!!modalKind"
      :title="modalTitle[modalKind]"
      :loading="saving"
      :submit-label="modalKind === 'addTour' || modalKind === 'addQuestion' ? 'Создать' : 'Сохранить'"
      @close="closeModal"
      @submit="submitModal"
    >
      <p v-if="error" class="error">{{ error }}</p>

      <template v-if="modalKind === 'addTour'">
        <label class="label" for="tour-title">Название тура</label>
        <input id="tour-title" v-model="form.title" class="input" placeholder="Например: Мемы" autofocus />
        <label class="label" for="tour-time">Время на ответ (сек)</label>
        <input
          id="tour-time"
          v-model="form.defaultTimeLimitSec"
          class="input"
          type="number"
          min="5"
          placeholder="60"
        />
        <p class="field-hint">По умолчанию 60 секунд (1 минута)</p>
      </template>

      <template v-else-if="modalKind === 'editTourTime' && activeTour">
        <p class="field-hint" style="margin-top: 0">Тур: {{ activeTour.title }}</p>
        <label class="label" for="edit-tour-time">Время на ответ (сек)</label>
        <input
          id="edit-tour-time"
          v-model="form.defaultTimeLimitSec"
          class="input"
          type="number"
          min="5"
          autofocus
        />
      </template>

      <template v-else-if="modalKind === 'addQuestion' && activeTour">
        <p class="field-hint" style="margin-top: 0">Тур: {{ activeTour.title }}</p>
        <label class="label" for="question-prompt">Текст задания</label>
        <textarea
          id="question-prompt"
          v-model="form.prompt"
          class="textarea"
          placeholder="Вопрос или задание"
          autofocus
        />
        <label class="label" for="question-answer">Правильный ответ</label>
        <input id="question-answer" v-model="form.correctAnswer" class="input" placeholder="Ответ" />
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
          Пусто — использовать дефолт тура ({{ activeTour.defaultTimeLimitSec }} сек)
        </p>
      </template>

      <template v-else-if="modalKind === 'editQuestionTime' && activeTour && activeQuestion">
        <p class="field-hint" style="margin-top: 0">
          {{ activeQuestion.prompt }}
        </p>
        <label class="label" for="edit-question-time">Время на ответ (сек)</label>
        <input
          id="edit-question-time"
          v-model="form.timeLimitSec"
          class="input"
          type="number"
          min="5"
          placeholder="Пусто = дефолт тура"
          autofocus
        />
        <p class="field-hint">
          Пусто — дефолт тура ({{ activeTour.defaultTimeLimitSec }} сек)
        </p>
      </template>
    </AdminModal>
  </div>
</template>
