<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Button from './Button.vue';
import TelegramLoginModal from './TelegramLoginModal.vue';
import { useAuth } from '../composables/useAuth';
import {
  fetchSeriesComments,
  submitSeriesComment,
  type SeriesComment,
} from '../lib/commentsApi';
import { formatPublishedAt } from '../lib/dates';

const props = defineProps<{
  seriesId: string;
}>();

const route = useRoute();
const { isAuthenticated, ready } = useAuth();

const comments = ref<SeriesComment[]>([]);
const loading = ref(true);
const message = ref('');
const formError = ref('');
const submitting = ref(false);
const showLogin = ref(false);
const canComment = ref(false);
const retryAfterSeconds = ref(0);
let cooldownTimer: ReturnType<typeof setInterval> | null = null;

const canSubmit = computed(
  () => isAuthenticated.value && canComment.value && message.value.trim().length > 0,
);

const formHint = computed(() => {
  if (!ready.value) return '';
  if (!isAuthenticated.value) return 'Войдите через Telegram, чтобы оставить комментарий.';
  if (!canComment.value && retryAfterSeconds.value > 0) {
    const mins = Math.floor(retryAfterSeconds.value / 60);
    const secs = retryAfterSeconds.value % 60;
    const wait =
      mins > 0 ? `${mins} мин ${secs.toString().padStart(2, '0')} сек` : `${secs} сек`;
    return `Следующий комментарий можно отправить через ${wait}.`;
  }
  return '';
});

function clearCooldownTimer() {
  if (cooldownTimer == null) return;
  clearInterval(cooldownTimer);
  cooldownTimer = null;
}

function startCooldownTicker() {
  clearCooldownTimer();
  if (retryAfterSeconds.value <= 0) return;
  cooldownTimer = setInterval(() => {
    if (retryAfterSeconds.value <= 1) {
      retryAfterSeconds.value = 0;
      canComment.value = isAuthenticated.value;
      clearCooldownTimer();
      return;
    }
    retryAfterSeconds.value -= 1;
  }, 1000);
}

async function loadComments() {
  loading.value = true;
  try {
    const data = await fetchSeriesComments(props.seriesId);
    comments.value = data.comments;
    canComment.value = data.canComment;
    retryAfterSeconds.value = data.retryAfterSeconds;
    startCooldownTicker();
  } catch {
    comments.value = [];
    canComment.value = false;
    retryAfterSeconds.value = 0;
  } finally {
    loading.value = false;
  }
}

async function scrollToCommentsIfNeeded() {
  if (route.hash !== '#comments') return;
  await nextTick();
  document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

onMounted(async () => {
  await loadComments();
  await scrollToCommentsIfNeeded();
});
watch(
  () => props.seriesId,
  () => {
    message.value = '';
    formError.value = '';
    void loadComments();
  },
);
watch(
  () => [ready.value, isAuthenticated.value] as const,
  () => {
    if (ready.value) void loadComments();
  },
);

async function onSubmit() {
  if (!canSubmit.value) return;
  formError.value = '';
  submitting.value = true;
  try {
    const data = await submitSeriesComment(props.seriesId, message.value);
    comments.value = [data.comment, ...comments.value];
    message.value = '';
    canComment.value = false;
    retryAfterSeconds.value = 5 * 60;
    startCooldownTicker();
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Не удалось отправить';
    await loadComments();
  } finally {
    submitting.value = false;
  }
}

async function onLoginSuccess() {
  showLogin.value = false;
  await loadComments();
}

onBeforeUnmount(() => {
  clearCooldownTimer();
});
</script>

<template>
  <div id="comments" class="card series-comments">
    <h2 class="section-heading">Комментарии</h2>

    <p v-if="loading" class="text-muted-sm">Загрузка комментариев…</p>
    <p v-else-if="!comments.length" class="text-muted-sm series-comments-empty">
      Пока нет комментариев — напишите первыми!
    </p>

    <div v-else class="comments-list">
      <article v-for="item in comments" :key="item.id" class="comment-item">
        <div class="comment-head">
          <img
            v-if="item.teamLogoUrl"
            :src="item.teamLogoUrl"
            alt=""
            class="comment-avatar"
            width="40"
            height="40"
          />
          <div class="comment-meta">
            <p class="comment-author">{{ item.telegramName }}</p>
            <p v-if="item.teamName" class="comment-team text-muted-sm">{{ item.teamName }}</p>
            <p v-if="item.createdAt" class="comment-date text-muted-sm">
              {{ formatPublishedAt(item.createdAt) }}
            </p>
          </div>
        </div>
        <p class="comment-body">{{ item.message }}</p>
      </article>
    </div>

    <div class="comment-form-block">
      <p v-if="formHint" class="text-muted-sm comment-form-hint">{{ formHint }}</p>

      <template v-if="isAuthenticated">
        <textarea
          v-model="message"
          class="comment-input"
          rows="3"
          maxlength="1000"
          placeholder="Ваш комментарий…"
          :disabled="!canComment || submitting"
        />
        <p v-if="formError" class="comment-form-error">{{ formError }}</p>
        <Button :disabled="submitting || !canSubmit" @click="onSubmit">
          {{ submitting ? 'Отправка…' : 'Отправить' }}
        </Button>
      </template>
      <Button v-else @click="showLogin = true">Войти</Button>
    </div>

    <TelegramLoginModal
      v-if="showLogin"
      title="Войти, чтобы оставить комментарий"
      @close="showLogin = false"
      @success="onLoginSuccess"
    />
  </div>
</template>

<style scoped>
.series-comments {
  margin-top: 24px;
}

.series-comments-empty {
  margin-bottom: 16px;
}

.comments-list {
  margin-bottom: 24px;
}

.comment-item {
  padding: 16px 0;
  border-top: 1px solid #e5e7eb;
}

.comment-item:first-child {
  border-top: none;
  padding-top: 0;
}

.comment-head {
  margin-bottom: 8px;
  font-size: 0;
}

.comment-avatar {
  display: inline-block;
  vertical-align: top;
  width: 40px;
  height: 40px;
  object-fit: cover;
  margin-right: 12px;
  background: #f3f4f6;
}

.comment-meta {
  display: inline-block;
  vertical-align: top;
  font-size: 14px;
  max-width: calc(100% - 52px);
}

.comment-author {
  margin: 0 0 2px;
  font-weight: bold;
}

.comment-team,
.comment-date {
  margin: 0;
}

.comment-body {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-form-block {
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}

.comment-form-hint {
  margin: 0 0 12px;
}

.comment-input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin: 0 0 12px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 0;
  font: inherit;
  resize: vertical;
  min-height: 80px;
}

.comment-input:disabled {
  background: #f9fafb;
  color: #6b7280;
}

.comment-form-error {
  margin: 0 0 12px;
  color: #dc2626;
}
</style>
