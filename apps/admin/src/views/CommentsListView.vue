<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { adminApi } from '../lib/api';

interface CommentRow {
  id: string;
  message: string;
  telegramName: string;
  teamName: string | null;
  hidden: boolean;
  createdAt: string;
  series: { id: string; number: number; title: string };
}

const comments = ref<CommentRow[]>([]);
const loading = ref(true);
const error = ref('');
const busyId = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    comments.value = await adminApi('/comments');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить';
    comments.value = [];
  } finally {
    loading.value = false;
  }
}

async function setHidden(item: CommentRow, hidden: boolean) {
  busyId.value = item.id;
  error.value = '';
  try {
    const updated = await adminApi<CommentRow>(`/comments/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ hidden }),
    });
    const idx = comments.value.findIndex((c) => c.id === item.id);
    if (idx >= 0) comments.value[idx] = updated;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось обновить';
  } finally {
    busyId.value = null;
  }
}

onMounted(load);

function preview(message: string) {
  const text = message.replace(/\s+/g, ' ').trim();
  if (text.length <= 120) return text;
  return `${text.slice(0, 119)}…`;
}
</script>

<template>
  <div>
    <h1 class="page-title">Комментарии</h1>
    <p class="hint text-muted">Скрытые комментарии не показываются на сайте.</p>
    <p v-if="loading" class="text-muted">Загрузка…</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <p v-else-if="!comments.length" class="text-muted">Комментариев пока нет.</p>
    <table v-else class="data-table">
      <thead>
        <tr>
          <th>Выпуск</th>
          <th>Автор</th>
          <th>Текст</th>
          <th>Дата</th>
          <th>Статус</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in comments" :key="item.id" :class="{ 'row-hidden': item.hidden }">
          <td>
            #{{ item.series.number }}: {{ item.series.title }}
          </td>
          <td>
            {{ item.telegramName }}
            <span v-if="item.teamName" class="team">{{ item.teamName }}</span>
          </td>
          <td class="message">{{ preview(item.message) }}</td>
          <td>{{ new Date(item.createdAt).toLocaleString('ru-RU') }}</td>
          <td>{{ item.hidden ? 'Скрыт' : 'Виден' }}</td>
          <td>
            <button
              v-if="!item.hidden"
              type="button"
              class="action-btn"
              :disabled="busyId === item.id"
              @click="setHidden(item, true)"
            >
              Скрыть
            </button>
            <button
              v-else
              type="button"
              class="action-btn"
              :disabled="busyId === item.id"
              @click="setHidden(item, false)"
            >
              Показать
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.hint {
  margin: 0 0 0.5rem;
}

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
  vertical-align: top;
}

.message {
  max-width: 28rem;
  word-break: break-word;
}

.team {
  display: block;
  color: #6b7280;
  font-size: 0.875rem;
}

.row-hidden {
  opacity: 0.55;
}

.action-btn {
  border: 1px solid #d1d5db;
  background: #fff;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
}

.action-btn:hover:not(:disabled) {
  border-color: #9ca3af;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
