<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { adminApi } from '../lib/api';
import AdminModal from '../components/AdminModal.vue';

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
const error = ref('');
const form = ref({ title: '', number: '' });

onMounted(async () => {
  series.value = await adminApi('/series');
  loading.value = false;
});

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
      <button class="btn" type="button" @click="openCreateModal">+ Новый выпуск</button>
    </div>

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
            <td>{{ item.status }}</td>
            <td>{{ item._count.tours }}</td>
            <td><RouterLink :to="`/series/${item.id}`">Редактировать</RouterLink></td>
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
