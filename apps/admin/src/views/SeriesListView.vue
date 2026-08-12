<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { adminApi } from '../lib/api';
import AdminModal from '../components/AdminModal.vue';
import AdminIcon from '../components/AdminIcon.vue';

interface SeriesRow {
  id: string;
  title: string;
  number: number;
  status: string;
  _count: { tours: number };
}

const series = ref<SeriesRow[]>([]);
const loading = ref(true);
const showCreateModal = ref(false);
const saving = ref(false);
const statusUpdatingId = ref<string | null>(null);
const error = ref('');
const form = ref({ title: '', number: '' });

async function loadSeries() {
  loading.value = true;
  try {
    series.value = await adminApi('/series');
  } finally {
    loading.value = false;
  }
}

onMounted(loadSeries);

function statusLabel(status: string) {
  return status === 'PUBLISHED' ? 'Опубликован' : 'Черновик';
}

async function updateStatus(item: SeriesRow, status: 'DRAFT' | 'PUBLISHED') {
  if (status === 'DRAFT' && !window.confirm(`Снять выпуск «${item.title}» с публикации?`)) return;

  statusUpdatingId.value = item.id;
  error.value = '';
  try {
    await adminApi(`/series/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: item.title,
        number: item.number,
        status,
      }),
    });
    series.value = await adminApi('/series');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось изменить статус';
  } finally {
    statusUpdatingId.value = null;
  }
}

function openCreateModal() {
  form.value = {
    title: '',
    number: String(series.value.length + 1),
  };
  error.value = '';
  showCreateModal.value = true;
}

function closeCreateModal() {
  showCreateModal.value = false;
  error.value = '';
}

async function submitCreate() {
  const title = form.value.title.trim();
  const number = Number.parseInt(form.value.number, 10);

  if (!title) {
    error.value = 'Введите название выпуска';
    return;
  }
  if (!Number.isFinite(number) || number < 1) {
    error.value = 'Укажите корректный номер выпуска';
    return;
  }

  saving.value = true;
  error.value = '';
  try {
    await adminApi('/series', {
      method: 'POST',
      body: JSON.stringify({ title, number, status: 'DRAFT' }),
    });
    series.value = await adminApi('/series');
    closeCreateModal();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка сохранения';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem">
      <h1 class="page-title">Выпуски</h1>
      <button class="btn" type="button" @click="openCreateModal">
        <AdminIcon name="plus-icon" />
        Новый выпуск
      </button>
    </div>

    <p v-if="error && !showCreateModal" class="error">{{ error }}</p>

    <div v-if="loading" class="card">Загрузка...</div>
    <div v-else class="card">
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Название</th>
            <th>Статус</th>
            <th>Туров</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in series" :key="item.id">
            <td>{{ item.number }}</td>
            <td>{{ item.title }}</td>
            <td>{{ statusLabel(item.status) }}</td>
            <td>{{ item._count.tours }}</td>
            <td class="actions-cell">
              <button
                v-if="item.status !== 'PUBLISHED'"
                class="btn btn-success btn-sm"
                type="button"
                :disabled="statusUpdatingId === item.id"
                @click="updateStatus(item, 'PUBLISHED')"
              >
                <AdminIcon name="publish-icon" />
                {{ statusUpdatingId === item.id ? 'Сохранение…' : 'Опубликовать' }}
              </button>
              <button
                v-else
                class="btn btn-warning btn-sm"
                type="button"
                :disabled="statusUpdatingId === item.id"
                @click="updateStatus(item, 'DRAFT')"
              >
                <AdminIcon name="unpublish-icon" />
                {{ statusUpdatingId === item.id ? 'Сохранение…' : 'Снять с публикации' }}
              </button>
              <RouterLink :to="`/series/${item.id}`" class="btn btn-secondary btn-sm">
                <AdminIcon name="pencil-icon" />
                Редактировать
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminModal
      :open="showCreateModal"
      title="Новый выпуск"
      submit-label="Создать"
      :loading="saving"
      @close="closeCreateModal"
      @submit="submitCreate"
    >
      <p v-if="error" class="error">{{ error }}</p>
      <label class="label" for="series-title">Название</label>
      <input
        id="series-title"
        v-model="form.title"
        class="input"
        placeholder="Например: Выпуск про мемы"
        autofocus
      />
      <label class="label" for="series-number">Номер выпуска</label>
      <input
        id="series-number"
        v-model="form.number"
        class="input"
        type="number"
        min="1"
        placeholder="1"
      />
    </AdminModal>
  </div>
</template>
