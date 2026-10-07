<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { adminApi } from '../lib/api';

interface ReviewRow {
  id: string;
  telegramName: string;
  teamName: string | null;
  published: boolean;
  createdAt: string;
}

const reviews = ref<ReviewRow[]>([]);
const loading = ref(true);
const error = ref('');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    reviews.value = await adminApi('/reviews');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить';
    reviews.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);

function statusLabel(published: boolean) {
  return published ? 'Опубликован' : 'На модерации';
}
</script>

<template>
  <div>
    <h1 class="page-title">Отзывы</h1>
    <p v-if="loading" class="text-muted">Загрузка…</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <p v-else-if="!reviews.length" class="text-muted">Отзывов пока нет.</p>
    <table v-else class="data-table">
      <thead>
        <tr>
          <th>Автор</th>
          <th>Команда</th>
          <th>Дата</th>
          <th>Статус</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in reviews" :key="item.id">
          <td>{{ item.telegramName }}</td>
          <td>{{ item.teamName || '—' }}</td>
          <td>{{ new Date(item.createdAt).toLocaleDateString('ru-RU') }}</td>
          <td>{{ statusLabel(item.published) }}</td>
          <td>
            <RouterLink :to="`/reviews/${item.id}`">Редактировать</RouterLink>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.text-muted {
  color: #6b7280;
}

.error {
  color: #dc2626;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.data-table th,
.data-table td {
  text-align: left;
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.data-table a {
  color: var(--color-accent, #2563eb);
}
</style>
