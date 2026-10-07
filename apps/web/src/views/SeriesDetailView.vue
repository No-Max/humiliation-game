<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { formatTourQuestionMeta } from '@humiliation-game/shared';
import { api } from '../lib/api';
import { formatPublishedAt } from '../lib/dates';
import { applyRouteSeo, plainTextFromHtml } from '../lib/seo';
import type { PublicSeries } from '../types/series';
import Button from '../components/Button.vue';
import QuestionChoices from '../components/QuestionChoices.vue';
import QuestionContent from '../components/QuestionContent.vue';

const route = useRoute();
const series = ref<PublicSeries | null>(null);
const loading = ref(true);
const notFound = ref(false);

const seriesId = computed(() => route.params.seriesId as string);

const toursWithSamples = computed(
  () => series.value?.tours.filter((tour) => tour.sampleQuestion) ?? [],
);

const publishedLabel = computed(() => formatPublishedAt(series.value?.publishedAt));

function applySeriesSeo(item: PublicSeries) {
  const title = `Выпуск ${item.number}: ${item.title}`;
  let description = `Онлайн квиз «${item.title}»: ${item.tours.length} туров.`;
  if (item.description) {
    const plain = plainTextFromHtml(item.description, 140);
    if (plain) description = plain;
  }
  applyRouteSeo({ title, description, index: true }, `/series/${item.id}`);
}

function applyNotFoundSeo() {
  applyRouteSeo(
    { title: 'Выпуск не найден', description: 'Такого выпуска нет или он не опубликован.', index: false },
    route.path,
  );
}

async function load() {
  loading.value = true;
  notFound.value = false;
  series.value = null;
  try {
    const item = await api<PublicSeries>(`/series/${seriesId.value}`);
    series.value = item;
    applySeriesSeo(item);
  } catch {
    notFound.value = true;
    applyNotFoundSeo();
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(seriesId, load);
</script>

<template>
  <div>
    <p v-if="loading" class="text-muted-sm">Загрузка…</p>
    <div v-else-if="notFound" class="card">
      <h1 class="page-title">Выпуск не найден</h1>
      <p class="text-muted-sm">Проверьте ссылку или выберите выпуск из списка.</p>
      <Button to="/series">К списку выпусков</Button>
    </div>
    <template v-else-if="series">
      <h1 class="page-title">#{{ series.number }}: {{ series.title }}</h1>
      <p v-if="publishedLabel" class="series-published text-muted-sm">{{ publishedLabel }}</p>
      <div class="card">
        <div
          v-if="series.description"
          class="rich-text-preview series-description"
          v-html="series.description"
        />
        <ul v-if="series.tours.length" class="series-tours-list">
          <li v-for="tour in series.tours" :key="tour.id">
            {{ tour.title }} —
            {{ formatTourQuestionMeta(tour._count.questions, tour.limitQuestionsToTeamCount) }}
          </li>
        </ul>
        <p v-else class="empty-tours text-muted-sm">Туры не добавлены</p>
        <div class="series-actions">
          <Button :to="`/lobby/${series.id}`">Играть</Button>
          <Button variant="secondary" to="/series">Все выпуски</Button>
        </div>
      </div>

      <section v-if="toursWithSamples.length" class="series-samples">
        <h2 class="series-samples-title">Примеры вопросов</h2>
        <div
          v-for="tour in toursWithSamples"
          :key="tour.id"
          class="card series-sample-card"
        >
          <h3 class="series-sample-tour">{{ tour.title }}</h3>
          <QuestionContent
            v-if="tour.sampleQuestion"
            side-by-side
            :prompt="tour.sampleQuestion.prompt ?? undefined"
            :media-urls="tour.sampleQuestion.mediaUrls"
            :audio-url="tour.sampleQuestion.audioUrl ?? undefined"
          />
          <QuestionChoices
            v-if="tour.sampleQuestion?.answerType === 'CHOICE' && tour.sampleQuestion.choices.length"
            :choices="tour.sampleQuestion.choices"
            readonly
          />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.series-published {
  margin: 8px 0 0;
}

.series-description {
  margin: 0 0 16px;
}

.series-tours-list {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
  color: #6b7280;
  font-size: 14px;
  display: grid;
  gap: 4px;
}

.empty-tours {
  margin: 0 0 16px;
}

.series-actions {
  display: block;
  font-size: 0;
}

.series-actions > :deep(*) {
  display: inline-block;
  margin-right: 8px;
  margin-bottom: 8px;
  font-size: 16px;
}

.card {
  margin-top: 16px;
}

.series-samples {
  margin-top: 24px;
}

.series-samples-title {
  margin: 0;
  font-size: 1.125rem;
}

.series-sample-card {
  margin-top: 16px;
}

.series-sample-tour {
  margin: 0 0 12px;
  font-size: inherit;
  font-weight: bold;
}

.series-sample-card :deep(.question-choices) {
  margin-top: 16px;
}
</style>
