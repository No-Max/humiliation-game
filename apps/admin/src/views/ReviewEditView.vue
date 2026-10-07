<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { adminApi } from '../lib/api';
import RichTextEditor from '../components/RichTextEditor.vue';
import AdminBreadcrumbs from '../components/AdminBreadcrumbs.vue';

interface ReviewDetail {
  id: string;
  message: string;
  telegramName: string;
  teamName: string | null;
  teamLogoUrl: string | null;
  published: boolean;
  createdAt: string;
}

const route = useRoute();
const router = useRouter();
const review = ref<ReviewDetail | null>(null);
const message = ref('');
const telegramName = ref('');
const teamName = ref('');
const teamLogoUrl = ref('');
const published = ref(false);
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const success = ref('');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const data = await adminApi<ReviewDetail>(`/reviews/${route.params.id}`);
    review.value = data;
    message.value = data.message;
    telegramName.value = data.telegramName;
    teamName.value = data.teamName ?? '';
    teamLogoUrl.value = data.teamLogoUrl ?? '';
    published.value = data.published;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить';
    review.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(load);

async function save() {
  if (!review.value) return;
  saving.value = true;
  error.value = '';
  success.value = '';
  try {
    await adminApi(`/reviews/${review.value.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: message.value,
        telegramName: telegramName.value,
        teamName: teamName.value.trim() || null,
        teamLogoUrl: teamLogoUrl.value.trim() || null,
        published: published.value,
      }),
    });
    success.value = 'Сохранено';
    await load();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось сохранить';
  } finally {
    saving.value = false;
  }
}

async function removeReview() {
  if (!review.value || !window.confirm('Удалить отзыв?')) return;
  try {
    await adminApi(`/reviews/${review.value.id}`, { method: 'DELETE' });
    await router.push('/reviews');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось удалить';
  }
}
</script>

<template>
  <div>
    <AdminBreadcrumbs
      :items="[
        { label: 'Отзывы', to: '/reviews' },
        { label: review?.telegramName || 'Отзыв' },
      ]"
    />
    <h1 class="page-title">Редактирование отзыва</h1>

    <p v-if="loading" class="text-muted">Загрузка…</p>
    <div v-else-if="review" class="card">
      <label for="review-telegram">Имя в Telegram</label>
      <input id="review-telegram" v-model="telegramName" class="input" type="text" />

      <label for="review-team">Название команды</label>
      <input id="review-team" v-model="teamName" class="input" type="text" maxlength="40" />

      <label for="review-logo">URL логотипа команды</label>
      <input id="review-logo" v-model="teamLogoUrl" class="input" type="text" />

      <label>Текст отзыва</label>
      <RichTextEditor v-model="message" placeholder="Текст отзыва" input-id="review-message" />

      <label class="checkbox-row">
        <input v-model="published" type="checkbox" />
        Опубликовать на сайте
      </label>

      <p v-if="success" class="success">{{ success }}</p>
      <p v-if="error" class="error">{{ error }}</p>

      <div class="actions">
        <button class="btn" type="button" :disabled="saving" @click="save">
          {{ saving ? 'Сохранение…' : 'Сохранить' }}
        </button>
        <button class="btn btn-secondary" type="button" @click="router.push('/reviews')">
          Назад
        </button>
        <button class="btn btn-secondary" type="button" @click="removeReview">Удалить</button>
      </div>
    </div>
    <p v-else-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.card {
  margin-top: 1rem;
}

label {
  display: block;
  font-weight: 600;
  margin: 1rem 0 0.5rem;
}

label:first-of-type {
  margin-top: 0;
}

.input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0;
  margin-bottom: 0.5rem;
}

.checkbox-row {
  display: block;
  margin: 1rem 0;
  font-weight: normal;
}

.checkbox-row input {
  margin-right: 0.5rem;
  vertical-align: middle;
}

.actions {
  margin-top: 1rem;
}

.actions .btn {
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}

.text-muted {
  color: #6b7280;
}

.success {
  color: #059669;
  font-weight: 600;
}

.error {
  color: #dc2626;
}
</style>
