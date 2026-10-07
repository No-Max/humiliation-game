<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Button from './Button.vue';
import RichTextEditor from './RichTextEditor.vue';
import TelegramLoginModal from './TelegramLoginModal.vue';
import { useAuth } from '../composables/useAuth';
import {
  fetchMyReview,
  fetchPublishedReviews,
  submitReview,
  type MyReview,
  type PublicReview,
} from '../lib/reviewsApi';
import { formatPublishedAt } from '../lib/dates';
import { plainTextFromHtml } from '../lib/seo';

const { isAuthenticated, ready } = useAuth();

const reviews = ref<PublicReview[]>([]);
const loading = ref(true);
const message = ref('');
const myReview = ref<MyReview | null>(null);
const canCreateNew = ref(false);
const monthlyLimit = ref(2);
const formError = ref('');
const submitting = ref(false);
const showLogin = ref(false);
const editing = ref(false);

const canSubmit = computed(() => {
  if (!isAuthenticated.value) return false;
  if (myReview.value?.published) return false;
  return plainTextFromHtml(message.value).length > 0;
});

const showEditor = computed(() => {
  if (!isAuthenticated.value) return false;
  if (myReview.value && !myReview.value.published) return editing.value;
  return canCreateNew.value;
});

const showEditButton = computed(
  () =>
    isAuthenticated.value &&
    !!myReview.value &&
    !myReview.value.published &&
    !editing.value,
);

const formHint = computed(() => {
  if (!ready.value) return '';
  if (!isAuthenticated.value) return 'Войдите через Telegram, чтобы оставить отзыв.';
  if (myReview.value && !myReview.value.published && !editing.value) {
    return 'Отзыв отправлен на модерацию. Можно обновить текст до публикации.';
  }
  if (!myReview.value && !canCreateNew.value) {
    return `Лимит: не больше ${monthlyLimit.value} отзывов в месяц. Попробуйте в следующем месяце.`;
  }
  return 'Отзыв появится на сайте после проверки.';
});

onMounted(async () => {
  try {
    const data = await fetchPublishedReviews();
    reviews.value = data.reviews;
  } catch {
    reviews.value = [];
  } finally {
    loading.value = false;
  }
});

watch(
  () => [ready.value, isAuthenticated.value] as const,
  async ([isReady, authed]) => {
    if (isReady && authed) await loadMine();
  },
  { immediate: true },
);

async function loadMine() {
  try {
    const data = await fetchMyReview();
    myReview.value = data.review;
    canCreateNew.value = data.canCreateNew;
    monthlyLimit.value = data.monthlyLimit;
    if (data.review && !data.review.published) {
      message.value = data.review.message;
      editing.value = false;
    } else {
      editing.value = false;
      if (!data.review) message.value = '';
    }
  } catch {
    myReview.value = null;
    canCreateNew.value = false;
  }
}

function startEditing() {
  formError.value = '';
  if (myReview.value && !myReview.value.published) {
    message.value = myReview.value.message;
  } else {
    message.value = '';
  }
  editing.value = true;
}

async function onSubmit() {
  if (!canSubmit.value) return;
  formError.value = '';
  submitting.value = true;
  try {
    const data = await submitReview(message.value);
    myReview.value = data.review;
    message.value = data.review.message;
    editing.value = false;
    await loadMine();
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Не удалось отправить';
  } finally {
    submitting.value = false;
  }
}

async function onLoginSuccess() {
  showLogin.value = false;
  await loadMine();
}
</script>

<template>
  <div class="card about-reviews">
    <h2 class="section-heading">Отзывы</h2>

    <p v-if="loading" class="text-muted-sm">Загрузка отзывов…</p>
    <p v-else-if="!reviews.length" class="text-muted-sm about-reviews-empty">
      Пока нет опубликованных отзывов — будьте первым!
    </p>

    <div v-else class="reviews-list">
      <article v-for="item in reviews" :key="item.id" class="review-item">
        <div class="review-head">
          <img
            v-if="item.teamLogoUrl"
            :src="item.teamLogoUrl"
            alt=""
            class="review-avatar"
            width="48"
            height="48"
          />
          <div class="review-meta">
            <p class="review-author">{{ item.telegramName }}</p>
            <p v-if="item.teamName" class="review-team text-muted-sm">{{ item.teamName }}</p>
            <p v-if="item.createdAt" class="review-date text-muted-sm">
              {{ formatPublishedAt(item.createdAt) }}
            </p>
          </div>
        </div>
        <div class="rich-text-preview review-body" v-html="item.message" />
      </article>
    </div>

    <div class="review-form-block">
      <h3 class="review-form-title">Оставить отзыв</h3>
      <p class="text-muted-sm review-form-hint">{{ formHint }}</p>

      <template v-if="showEditor">
        <RichTextEditor
          v-model="message"
          placeholder="Расскажите, как прошла игра…"
          input-id="about-review-message"
        />
        <p v-if="formError" class="review-form-error">{{ formError }}</p>
        <Button :disabled="submitting || !canSubmit" @click="onSubmit">
          {{ submitting ? 'Отправка…' : myReview ? 'Сохранить' : 'Отправить отзыв' }}
        </Button>
      </template>
      <Button v-else-if="showEditButton" @click="startEditing">Редактировать</Button>
      <Button v-else-if="!isAuthenticated" @click="showLogin = true">Войти</Button>
    </div>

    <TelegramLoginModal
      v-if="showLogin"
      title="Войти, чтобы оставить отзыв"
      @close="showLogin = false"
      @success="onLoginSuccess"
    />
  </div>
</template>

<style scoped>
.about-reviews {
  margin-top: 16px;
}

.about-reviews-empty {
  margin-bottom: 16px;
}

.reviews-list {
  margin-bottom: 24px;
}

.review-item {
  padding: 16px 0;
  border-top: 1px solid #e5e7eb;
}

.review-item:first-child {
  border-top: none;
  padding-top: 0;
}

.review-head {
  margin-bottom: 12px;
  font-size: 0;
}

.review-avatar {
  display: inline-block;
  vertical-align: top;
  width: 48px;
  height: 48px;
  object-fit: cover;
  margin-right: 12px;
  background: #f3f4f6;
}

.review-meta {
  display: inline-block;
  vertical-align: top;
  font-size: 14px;
  max-width: calc(100% - 60px);
}

.review-author {
  margin: 0 0 4px;
  font-weight: bold;
}

.review-team,
.review-date {
  margin: 0;
}

.review-body {
  margin: 0;
}

.review-form-block {
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}

.review-form-title {
  margin: 0 0 8px;
  font-size: 1.125rem;
}

.review-form-hint {
  margin: 0 0 12px;
}

.review-form-error {
  margin: 0 0 12px;
  color: #dc2626;
}
</style>
