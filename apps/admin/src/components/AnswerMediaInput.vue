<script setup lang="ts">
import { ref } from 'vue';
import { adminUploadAnswerMedia } from '../lib/api';
import { filesFromClipboard, focusPasteBlock } from '../lib/useClipboardFiles';
import {
  formatMaxAnswerMediaSize,
  isAnswerMediaTooLarge,
} from '../lib/uploadLimits';
import AdminIcon from './AdminIcon.vue';
import MediaPickerModal from './MediaPickerModal.vue';
import type { MediaLibraryItem } from '../lib/mediaLibrary';

type AnswerMediaType = 'IMAGE' | 'AUDIO' | 'VIDEO';

interface AnswerMediaItem {
  url: string;
  type: AnswerMediaType;
}

const items = defineModel<AnswerMediaItem[]>({ default: () => [] });

const uploading = ref(false);
const error = ref('');
const showGallery = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const rootRef = ref<HTMLElement | null>(null);

function typeLabel(type: AnswerMediaType): string {
  if (type === 'IMAGE') return 'Картинка';
  if (type === 'AUDIO') return 'Аудио';
  return 'Видео';
}

function mimeToType(mime: string): AnswerMediaType | null {
  if (mime.startsWith('image/')) return 'IMAGE';
  if (mime.startsWith('audio/')) return 'AUDIO';
  if (mime.startsWith('video/')) return 'VIDEO';
  return null;
}

async function uploadFiles(files: File[]) {
  if (!files.length || uploading.value) return;

  uploading.value = true;
  error.value = '';

  try {
    const uploaded: AnswerMediaItem[] = [];
    for (const file of files) {
      const kind = mimeToType(file.type);
      if (!kind) {
        throw new Error('Можно загружать только изображения, аудио или видео');
      }
      if (isAnswerMediaTooLarge(file)) {
        throw new Error(`Файл «${file.name}» слишком большой. Максимум ${formatMaxAnswerMediaSize()}`);
      }
      const result = await adminUploadAnswerMedia(file);
      uploaded.push({
        url: result.url,
        type: mimeToType(result.mimeType) ?? kind,
      });
    }
    items.value = [...items.value, ...uploaded];
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

async function onPaste(event: ClipboardEvent) {
  const files = filesFromClipboard(event).filter((file) => !!mimeToType(file.type));
  if (!files.length) return;
  event.preventDefault();
  await uploadFiles(files);
}

function focusBlock(event: MouseEvent) {
  focusPasteBlock(event, rootRef.value);
}

function removeAt(index: number) {
  items.value = items.value.filter((_, i) => i !== index);
}

function moveAt(index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.value.length) return;
  const next = [...items.value];
  [next[index], next[target]] = [next[target], next[index]];
  items.value = next;
}

function openPicker() {
  inputRef.value?.click();
}

function openGallery() {
  showGallery.value = true;
}

function onGallerySelect(selected: MediaLibraryItem[]) {
  const existing = new Set(items.value.map((item) => item.url));
  const added = selected.flatMap((item) => {
    const type = mimeToType(item.mimeType);
    if (!type || existing.has(item.url)) return [];
    existing.add(item.url);
    return [{ url: item.url, type }];
  });
  items.value = [...items.value, ...added];
}
</script>

<template>
  <div
    ref="rootRef"
    class="answer-media"
    tabindex="0"
    @mousedown="focusBlock"
    @paste="onPaste"
  >
    <label class="label">Медиа правильного ответа</label>
    <p class="field-hint media-hint">
      Необязательно. Несколько картинок, аудио или видео — на экране правильного ответа:
      и когда кто-то ответил верно, и когда никто не угадал.
      Максимальный размер одного файла — {{ formatMaxAnswerMediaSize() }}.
      Кликните по блоку и вставьте картинку из буфера (Ctrl/⌘+V).
    </p>

    <p v-if="error" class="error">{{ error }}</p>

    <ul v-if="items.length" class="media-list">
      <li
        v-for="(item, index) in items"
        :key="`${item.url}-${index}`"
        class="media-item"
      >
        <img
          v-if="item.type === 'IMAGE'"
          :src="item.url"
          alt=""
          class="preview-img"
        />
        <div v-else class="preview-file">
          <span class="preview-type">{{ typeLabel(item.type) }}</span>
          <span class="preview-url">{{ item.url.split('/').pop() }}</span>
        </div>
        <div class="media-actions">
          <button
            class="variants-move"
            type="button"
            :disabled="index === 0"
            aria-label="Выше"
            @click="moveAt(index, -1)"
          >
            ↑
          </button>
          <button
            class="variants-move"
            type="button"
            :disabled="index === items.length - 1"
            aria-label="Ниже"
            @click="moveAt(index, 1)"
          >
            ↓
          </button>
          <button
            class="variants-remove"
            type="button"
            aria-label="Удалить"
            @click="removeAt(index)"
          >
            ×
          </button>
        </div>
      </li>
    </ul>

    <input
      ref="inputRef"
      class="media-file-input"
      type="file"
      accept="image/*,audio/*,video/*"
      multiple
      @change="onFilesSelected"
    />
    <div class="media-upload-actions">
      <button
        class="btn btn-secondary"
        type="button"
        :disabled="uploading"
        @click="openPicker"
      >
        <AdminIcon name="publish-icon" />
        {{ uploading ? 'Загрузка…' : 'Загрузить файлы' }}
      </button>
      <button class="btn btn-secondary" type="button" :disabled="uploading" @click="openGallery">
        <AdminIcon name="layers-icon" />
        Из галереи
      </button>
    </div>

    <MediaPickerModal
      :open="showGallery"
      filter="all"
      upload-mode="answer-media"
      @close="showGallery = false"
      @select="onGallerySelect"
    />
  </div>
</template>

<style scoped>
.answer-media {
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  outline: none;
  cursor: pointer;
}

.answer-media:focus,
.answer-media:focus-within {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
  cursor: default;
}

.media-hint {
  margin-top: 0;
}

.media-list {
  list-style: none;
  padding: 0;
  margin: 0 0 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 420px;
}

.media-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.preview-img {
  display: block;
  width: 100px;
  height: 72px;
  object-fit: cover;
  border-radius: 4px;
  background: #e5e7eb;
  flex-shrink: 0;
}

.preview-file {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  flex: 1;
}

.preview-type {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
}

.preview-url {
  font-size: 0.875rem;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.media-actions {
  display: flex;
  gap: 0.125rem;
  margin-left: auto;
  flex-shrink: 0;
}

.variants-move,
.variants-remove {
  border: none;
  background: none;
  color: #6b7280;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.125rem 0.35rem;
}

.variants-move:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.variants-remove:hover {
  color: #dc2626;
}

.media-file-input {
  display: none;
}

.media-upload-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
