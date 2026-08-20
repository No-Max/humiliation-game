<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import AdminIcon from '../components/AdminIcon.vue';
import MediaFileCard from '../components/MediaFileCard.vue';
import MediaPagination from '../components/MediaPagination.vue';
import MediaSearchInput from '../components/MediaSearchInput.vue';
import { adminApi, adminUpload, adminUploadAnswerMedia } from '../lib/api';
import {
  mediaListQuery,
  MEDIA_PAGE_SIZE,
  type MediaKind,
  type MediaLibraryItem,
  type MediaLibraryPage,
} from '../lib/mediaLibrary';
import { formatMaxAnswerMediaSize, isAnswerMediaTooLarge } from '../lib/uploadLimits';

type Filter = MediaKind | 'all';

const items = ref<MediaLibraryItem[]>([]);
const filter = ref<Filter>('all');
const search = ref('');
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);
const loading = ref(true);
const uploading = ref(false);
const deletingId = ref<string | null>(null);
const error = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'image', label: 'Картинки' },
  { value: 'audio', label: 'Аудио' },
  { value: 'video', label: 'Видео' },
];

watch(filter, () => {
  page.value = 1;
  void load();
});

let searchDebounce: ReturnType<typeof setTimeout> | null = null;

watch(search, () => {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    page.value = 1;
    void load(1);
  }, 300);
});

async function load(targetPage = page.value) {
  loading.value = true;
  error.value = '';
  try {
    const data = await adminApi<MediaLibraryPage>(
      mediaListQuery(targetPage, filter.value, MEDIA_PAGE_SIZE, search.value),
    );
    items.value = data.items;
    page.value = data.page;
    totalPages.value = data.totalPages;
    total.value = data.total;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить галерею';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void load();
});

async function renameItem(item: MediaLibraryItem, filename: string) {
  error.value = '';
  try {
    const updated = await adminApi<MediaLibraryItem>(`/media/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({ filename }),
    });
    items.value = items.value.map((entry) => (entry.id === item.id ? updated : entry));
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось переименовать';
  }
}

async function deleteItem(item: MediaLibraryItem) {
  if (!window.confirm(`Удалить «${item.filename}» из галереи? Файл пропадёт из всех мест, где используется эта ссылка.`)) {
    return;
  }

  deletingId.value = item.id;
  error.value = '';
  try {
    await adminApi(`/media/${item.id}`, { method: 'DELETE' });
    const nextPage = items.value.length === 1 && page.value > 1 ? page.value - 1 : page.value;
    await load(nextPage);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось удалить';
  } finally {
    deletingId.value = null;
  }
}

async function uploadFiles(files: File[]) {
  if (!files.length || uploading.value) return;

  uploading.value = true;
  error.value = '';

  try {
    for (const file of files) {
      const isMedia =
        file.type.startsWith('image/')
        || file.type.startsWith('audio/')
        || file.type.startsWith('video/');
      if (!isMedia) {
        throw new Error('Можно загружать только изображения, аудио или видео');
      }

      if (file.type.startsWith('image/')) {
        await adminUpload(file);
      } else {
        if (isAnswerMediaTooLarge(file)) {
          throw new Error(`Файл «${file.name}» слишком большой. Максимум ${formatMaxAnswerMediaSize()}`);
        }
        await adminUploadAnswerMedia(file);
      }
    }
    page.value = 1;
    await load(1);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка загрузки';
  } finally {
    uploading.value = false;
  }
}

async function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = '';
  await uploadFiles(files);
}

function openPicker() {
  inputRef.value?.click();
}

function goPrevPage() {
  if (page.value <= 1) return;
  void load(page.value - 1);
}

function goNextPage() {
  if (page.value >= totalPages.value) return;
  void load(page.value + 1);
}
</script>

<template>
  <div>
    <div class="media-page-header">
      <h1 class="page-title">Галерея медиа</h1>
      <button class="btn" type="button" :disabled="uploading" @click="openPicker">
        <AdminIcon name="publish-icon" />
        {{ uploading ? 'Загрузка…' : 'Загрузить' }}
      </button>
    </div>

    <p class="field-hint media-page-hint">
      Все загруженные файлы сохраняются здесь. Их можно переиспользовать в заданиях и турах.
    </p>

    <div class="media-toolbar">
      <div class="media-filters">
        <button
          v-for="option in filters"
          :key="option.value"
          class="btn btn-secondary btn-sm"
          :class="{ 'filter-active': filter === option.value }"
          type="button"
          @click="filter = option.value"
        >
          {{ option.label }}
        </button>
      </div>
      <MediaSearchInput v-model="search" />
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="field-hint">Загрузка…</p>

    <div v-else-if="!items.length" class="card">
      <p style="margin: 0; color: #6b7280">
        {{ search.trim() ? `По запросу «${search.trim()}» ничего не найдено.` : 'Файлов пока нет. Загрузите первый.' }}
      </p>
    </div>

    <template v-else>
      <div class="media-grid">
        <MediaFileCard
          v-for="item in items"
          :key="item.id"
          :item="item"
          editable
          :deleting="deletingId === item.id"
          @rename="renameItem(item, $event)"
          @delete="deleteItem(item)"
        />
      </div>

      <MediaPagination
        :page="page"
        :total-pages="totalPages"
        :total="total"
        :disabled="loading || uploading || deletingId !== null"
        @prev="goPrevPage"
        @next="goNextPage"
      />
    </template>

    <input
      ref="inputRef"
      class="media-page-file-input"
      type="file"
      accept="image/*,audio/*,video/*"
      multiple
      @change="onFilesSelected"
    />
  </div>
</template>

<style scoped>
.media-page-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.media-page-hint {
  margin-top: 0;
}

.media-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 1rem 0;
}

.media-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-active {
  background: #eef2ff;
  border-color: #4f46e5;
  color: #4338ca;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.media-page-file-input {
  display: none;
}
</style>
