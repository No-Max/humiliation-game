<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AdminModal from './AdminModal.vue';
import MediaFileCard from './MediaFileCard.vue';
import MediaPagination from './MediaPagination.vue';
import MediaSearchInput from './MediaSearchInput.vue';
import { adminApi, adminUpload, adminUploadAnswerMedia } from '../lib/api';
import {
  mediaListQuery,
  MEDIA_PICKER_PAGE_SIZE,
  type MediaKind,
  type MediaLibraryItem,
  type MediaLibraryPage,
} from '../lib/mediaLibrary';
import { formatMaxAnswerMediaSize, isAnswerMediaTooLarge } from '../lib/uploadLimits';
import { useMediaDropZone } from '../lib/useMediaDropZone';

const props = withDefaults(
  defineProps<{
    open: boolean;
    multiple?: boolean;
    filter?: MediaKind | 'all';
    uploadMode?: 'image' | 'answer-media';
  }>(),
  {
    multiple: true,
    filter: 'image',
    uploadMode: 'image',
  },
);

const emit = defineEmits<{
  close: [];
  select: [items: MediaLibraryItem[]];
}>();

const items = ref<MediaLibraryItem[]>([]);
const search = ref('');
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);
const loading = ref(false);
const uploading = ref(false);
const deletingId = ref<string | null>(null);
const error = ref('');
const selectedIds = ref<Set<string>>(new Set());
const inputRef = ref<HTMLInputElement | null>(null);

watch(
  () => props.open,
  (open) => {
    if (open) {
      selectedIds.value = new Set();
      error.value = '';
      search.value = '';
      page.value = 1;
      void load(1);
    }
  },
);

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
      mediaListQuery(targetPage, props.filter, MEDIA_PICKER_PAGE_SIZE, search.value),
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

function toggleItem(id: string) {
  const next = new Set(selectedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else if (props.multiple) {
    next.add(id);
  } else {
    next.clear();
    next.add(id);
  }
  selectedIds.value = next;
}

function confirmSelection() {
  const selected = items.value.filter((item) => selectedIds.value.has(item.id));
  if (!selected.length) {
    error.value = 'Выберите хотя бы один файл';
    return;
  }
  emit('select', selected);
  emit('close');
}

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
  if (
    !window.confirm(
      `Удалить «${item.filename}» из галереи? Файл пропадёт из всех мест, где используется эта ссылка.`,
    )
  ) {
    return;
  }

  deletingId.value = item.id;
  error.value = '';
  try {
    await adminApi(`/media/${item.id}`, { method: 'DELETE' });
    const nextSelected = new Set(selectedIds.value);
    nextSelected.delete(item.id);
    selectedIds.value = nextSelected;
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
      if (props.uploadMode === 'image' && !file.type.startsWith('image/')) {
        throw new Error('Можно загружать только изображения');
      }
      if (props.uploadMode === 'answer-media') {
        if (isAnswerMediaTooLarge(file)) {
          throw new Error(`Файл «${file.name}» слишком большой. Максимум ${formatMaxAnswerMediaSize()}`);
        }
        await adminUploadAnswerMedia(file);
      } else {
        await adminUpload(file);
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

const acceptAttr = computed(() => {
  if (props.uploadMode === 'answer-media') return 'image/*,audio/*,video/*';
  return 'image/*';
});

function acceptDroppedFile(file: File): boolean {
  if (props.filter === 'image') return file.type.startsWith('image/');
  if (props.filter === 'audio') return file.type.startsWith('audio/');
  if (props.filter === 'video') return file.type.startsWith('video/');
  return (
    file.type.startsWith('image/')
    || file.type.startsWith('audio/')
    || file.type.startsWith('video/')
  );
}

const { dragOver, onDragEnter, onDragLeave, onDragOver, onDrop } = useMediaDropZone({
  accept: acceptDroppedFile,
  onFiles: uploadFiles,
  disabled: uploading,
});
</script>

<template>
  <AdminModal
    :open="open"
    title="Галерея медиа"
    submit-label="Выбрать"
    max-width="750px"
    :loading="uploading"
    @close="emit('close')"
    @submit="confirmSelection"
  >
    <div
      class="picker-drop-area"
      :class="{ 'picker-drop-area--drag-over': dragOver }"
      @dragenter="onDragEnter"
      @dragleave="onDragLeave"
      @dragover="onDragOver"
      @drop="onDrop"
    >
    <p class="field-hint picker-hint">
      Выберите файлы, загрузите новые, перетащите сюда или переименуйте и удалите ненужные.
    </p>

    <MediaSearchInput v-model="search" bottom-gap />

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="field-hint">Загрузка…</p>

    <div v-else-if="!items.length" class="picker-empty">
      <p>
        {{ search.trim() ? `По запросу «${search.trim()}» ничего не найдено.` : 'В галерее пока нет подходящих файлов.' }}
      </p>
    </div>

    <template v-else>
      <div class="picker-grid">
        <MediaFileCard
          v-for="item in items"
          :key="item.id"
          :item="item"
          selectable
          editable
          :selected="selectedIds.has(item.id)"
          :deleting="deletingId === item.id"
          @toggle="toggleItem(item.id)"
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

    </div>

    <template #actions-start>
      <input
        ref="inputRef"
        class="picker-file-input"
        type="file"
        :accept="acceptAttr"
        multiple
        @change="onFilesSelected"
      />
      <button
        class="btn btn-secondary"
        type="button"
        :disabled="uploading"
        @click="openPicker"
      >
        {{ uploading ? 'Загрузка…' : 'Загрузить новые файлы' }}
      </button>
    </template>
  </AdminModal>
</template>

<style scoped>
.picker-hint {
  margin-top: 0;
}

.picker-drop-area {
  padding: 0.25rem;
  margin: -0.25rem;
  border: 2px dashed transparent;
  border-radius: 10px;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.picker-drop-area--drag-over {
  border-color: #4f46e5;
  background: #f5f3ff;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.picker-empty {
  color: #6b7280;
  margin-bottom: 0.75rem;
}

.picker-file-input {
  display: none;
}
</style>
