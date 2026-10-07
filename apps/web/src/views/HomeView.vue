<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { formatQuestionCount } from '@humiliation-game/shared';
import Button from '../components/Button.vue';
import { api } from '../lib/api';
import { formatPublishedAt } from '../lib/dates';
import { plainTextFromHtml } from '../lib/seo';
import type { PublicSeries } from '../types/series';
import heroUrl from '../assets/hero.svg';

const latestSeries = ref<PublicSeries | null>(null);

const publishedLabel = computed(() => formatPublishedAt(latestSeries.value?.publishedAt));

const questionsTotal = computed(() => {
  const item = latestSeries.value;
  if (!item) return 0;
  return item.tours.reduce((sum, tour) => sum + tour._count.questions, 0);
});

function toursCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'тур';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'тура';
  return 'туров';
}

onMounted(async () => {
  try {
    const list = await api<PublicSeries[]>('/series');
    latestSeries.value = list[0] ?? null;
  } catch {
    latestSeries.value = null;
  }
});
</script>

<template>
  <div>
    <img
      :src="heroUrl"
      alt="Игра на унижение — онлайн квиз для друзей, позоримся вместе"
      class="home-hero"
      width="1516"
      height="872"
    />

    <div class="card steps-card">
      <h2 class="section-heading">Как начать играть</h2>
      <div class="steps">
        <div class="step">
          <span class="step-num">1</span>
          <div>
            <strong>Создайте команду</strong>
            <p>Выберите выпуск и введите название команды</p>
          </div>
        </div>
        <div class="step">
          <span class="step-num">2</span>
          <div>
            <strong>Подключите соперника</strong>
            <p>Поделитесь ссылкой или QR-кодом</p>
          </div>
        </div>
        <div class="step">
          <span class="step-num">3</span>
          <div>
            <strong>Откройте экран</strong>
            <p>На TV или ноуте — для показа заданий всем</p>
          </div>
        </div>
      </div>
    </div>

    <div class="card intro-card">
      <p class="intro-text">
        Игра на унижение — это очень простая интелектуальная игра не требующая глубоких знаний. Игра состоит из нескольких туров наполненных забавными вопросами и заданиями.
      </p>
      <p class="intro-text">
        Собирайтесь с друзьями, выбирайте выпуск, смейтесь и получайте удовольствие от игры и от ваших знаний.
      </p>
      <p class="intro-text">Удачи!</p>
      <Button class="intro-btn" to="/series">Выбрать выпуск</Button>
    </div>

    <div v-if="latestSeries" class="card latest-series-card">
      <p class="latest-series-eyebrow text-muted-sm">Новый выпуск</p>
      <h2 class="latest-series-title">
        <RouterLink :to="`/series/${latestSeries.id}`">
          #{{ latestSeries.number }}: {{ latestSeries.title }}
        </RouterLink>
      </h2>
      <p v-if="publishedLabel" class="latest-series-date text-muted-sm">{{ publishedLabel }}</p>
      <p v-if="latestSeries.description" class="latest-series-teaser">
        {{ plainTextFromHtml(latestSeries.description, 200) }}
      </p>
      <p v-if="latestSeries.tours.length" class="latest-series-meta text-muted-sm">
        {{ latestSeries.tours.length }} {{ toursCountLabel(latestSeries.tours.length) }},
        {{ formatQuestionCount(questionsTotal) }}
      </p>
      <div class="latest-series-actions">
        <Button :to="`/lobby/${latestSeries.id}`" icon="play">Играть</Button>
        <Button :to="`/series/${latestSeries.id}`" variant="secondary">Подробнее</Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-hero {
  display: block;
  width: 100%;
  height: auto;
  margin: 0 auto;
  box-shadow: 0 1px 3px rgb(0 0 0 / 8%);
}

.latest-series-card {
  margin-top: 16px;
  border-left: 4px solid var(--color-accent);
}

.latest-series-eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
}

.latest-series-title {
  margin: 0 0 8px;
  font-size: 1.25rem;
}

.latest-series-title a {
  color: inherit;
  text-decoration: none;
}

.latest-series-title a:hover {
  color: var(--color-accent);
}

.latest-series-date {
  margin: 0 0 8px;
}

.latest-series-teaser {
  margin: 0 0 8px;
}

.latest-series-meta {
  margin: 0 0 16px;
}

.latest-series-actions {
  display: block;
  font-size: 0;
}

.latest-series-actions > :deep(*) {
  display: inline-block;
  margin-right: 8px;
  margin-bottom: 8px;
  font-size: 16px;
}

.intro-card {
  margin-top: 16px;
}

.intro-btn {
  margin-top: 16px;
}

.steps-card {
  margin-top: 16px;
}

.steps {
  display: block;
  margin-top: 16px;
}

.steps > * + * {
  margin-top: 16px;
}

.step {
  display: block;
}

.step-num {
  display: inline-block;
  vertical-align: top;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #fec31b;
  color: #1a1a2e;
  text-align: center;
  line-height: 32px;
  font-weight: bold;
}

.step > :not(.step-num) {
  display: inline-block;
  vertical-align: top;
  width: calc(100% - 48px);
  margin-left: 16px;
}

.intro-text {
  margin-bottom: 8px;
}

.intro-text:last-child {
  margin-bottom: 0;
}
</style>
