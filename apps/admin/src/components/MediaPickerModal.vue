<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AdminModal from './AdminModal.vue';
import MediaFileCard from './MediaFileCard.vue';
import MediaPagination from './MediaPagination.vue';
import { adminApi, adminUpload, adminUploadAnswerMedia } from '../lib/api';
import {
  mediaListQuery,
  MEDIA_PICKER_PAGE_SIZE,
  type MediaKind,
  type MediaLibraryItem,
  type MediaLibraryPage,
} from '../lib/mediaLibrary';
import { formatMaxAnswerMediaSize, isAnswerMediaTooLarge } from '../lib/uploadLimits';

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
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);
const loading = ref(false);
const uploading = ref(false);
const error = ref('');
const selectedIds = ref<Set<string>>(new Set());
const inputRef = ref<HTMLInputElement | null>(null);

watch(
  () => props.open,
  (open) => {
    if (open) {
      selectedIds.value = new Set();
      error.value = '';
      page.value = 1;
      void load(1);
    }
  },
);

async function load(targetPage = page.value) {
  loading.value = true;
  error.value = '';
  try {
    const data = await adminApi<MediaLibraryPage>(
      mediaListQuery(targetPage, props.filter, MEDIA_PICKER_PAGE_SIZE),
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
    <p class="field-hint picker-hint">
      Выберите файлы из галереи или загрузите новые — они сохранятся для повторного использования.
    </p>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="field-hint">Загрузка…</p>

    <div v-else-if="!items.length" class="picker-empty">
      <p>В галерее пока нет подходящих файлов.</p>
    </div>

    <template v-else>
      <div class="picker-grid">
        <MediaFileCard
          v-for="item in items"
          :key="item.id"
          :item="item"
          selectable
          :selected="selectedIds.has(item.id)"
          @toggle="toggleItem(item.id)"
        />
      </div>

      <MediaPagination
        :page="page"
        :total-pages="totalPages"
        :total="total"
        :disabled="loading || uploading"
        @prev="goPrevPage"
        @next="goNextPage"
      />
    </template>

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
