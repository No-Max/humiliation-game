<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { formatQuestionCount } from '@humiliation-game/shared';
import { api } from '../lib/api';
import { formatPublishedAt } from '../lib/dates';
import { plainTextFromHtml } from '../lib/seo';
import type { PublicSeries } from '../types/series';
import Button from '../components/Button.vue';

const series = ref<PublicSeries[]>([]);
const loading = ref(true);
const error = ref('');

function toursCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'тур';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'тура';
  return 'туров';
}

function questionsTotal(item: PublicSeries): number {
  return item.tours.reduce((sum, tour) => sum + tour._count.questions, 0);
}

function commentsCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} комментарий`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} комментария`;
  return `${count} комментариев`;
}

onMounted(async () => {
  try {
    series.value = await api('/series');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка загрузки';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <h1 class="page-title">Выпуски</h1>
    <p class="series-loading" v-if="loading">Загрузка...</p>
    <p class="series-error" v-else-if="error">{{ error }}</p>
    <div class="card" v-else-if="!series.length">Пока нет опубликованных выпусков</div>
    <div v-else class="series-list">
      <div v-for="item in series" :key="item.id" class="card">
        <div class="series-card-actions">
          <Button :to="`/lobby/${item.id}`" icon="play">Играть</Button>
        </div>
        <h2 class="series-card-title">
          <RouterLink :to="`/series/${item.id}`">#{{ item.number }}: {{ item.title }}</RouterLink>
        </h2>
        <p v-if="formatPublishedAt(item.publishedAt)" class="series-published text-muted-sm">
          {{ formatPublishedAt(item.publishedAt) }}
        </p>
        <p v-if="item.description" class="series-teaser">
          {{ plainTextFromHtml(item.description, 200) }}
        </p>
        <div class="series-card-footer">
          <RouterLink :to="`/series/${item.id}`" class="series-more-link">Подробнее</RouterLink>
          <p class="series-tours-summary text-muted-sm">
            <template v-if="item.tours.length">
              {{ item.tours.length }} {{ toursCountLabel(item.tours.length) }},
              {{ formatQuestionCount(questionsTotal(item)) }}
              <span class="series-summary-sep">·</span>
            </template>
            <RouterLink
              :to="`/series/${item.id}#comments`"
              class="series-reviews-link"
            >
              {{
                (item.commentsCount ?? 0) > 0
                  ? commentsCountLabel(item.commentsCount ?? 0)
                  : 'Оставить комментарий'
              }}
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.series-card-title {
  margin: 0 0 8px;
  font-size: 1.125rem;
}

.series-card-title a {
  color: inherit;
  text-decoration: none;
}

.series-card-title a:hover {
  color: var(--color-accent);
}

.series-published {
  margin: 0 0 8px;
}

.series-teaser {
  margin: 0 0 8px;
}

.series-card-footer {
  margin: 0;
}

.series-card-footer::after {
  content: '';
  display: table;
  clear: both;
}

.series-more-link {
  float: right;
  margin-left: 12px;
  font-weight: bold;
  white-space: nowrap;
}

.series-tours-summary {
  margin: 0;
}

.series-summary-sep {
  margin: 0 0.35em;
}

.series-reviews-link {
  font-weight: 600;
  color: inherit;
  text-decoration: none;
}

.series-reviews-link:hover {
  color: var(--color-accent);
}

.series-card-actions {
  float: right;
  margin: 0 0 8px 16px;
}

.series-loading, .series-error {
  margin-top: 16px;
}

.series-list .card {
  margin-top: 16px;
}

.series-list .card::after {
  content: '';
  display: table;
  clear: both;
}

@media (max-width: 500px) {
  .series-list .card {
    position: relative;
    padding-bottom: 64px;
  }

  .series-more-link {
    display: none;
  }

  .series-card-actions {
    float: none;
    position: absolute;
    right: 16px;
    bottom: 16px;
    margin: 0;
  }
}
</style>
