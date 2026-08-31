<script setup lang="ts">
import { ref } from 'vue';
import { adminUploadAnswerMedia } from '../lib/api';
import {
  formatMaxAnswerMediaSize,
  isAnswerMediaTooLarge,
} from '../lib/uploadLimits';
import { useMediaDropZone } from '../lib/useMediaDropZone';
import AdminIcon from './AdminIcon.vue';
import MediaPickerModal from './MediaPickerModal.vue';
import type { MediaLibraryItem } from '../lib/mediaLibrary';

const url = defineModel<string>({ default: '' });

const uploading = ref(false);
const error = ref('');
const showGallery = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const rootRef = ref<HTMLElement | null>(null);

async function uploadFiles(files: File[]) {
  const file = files.find((item) => item.type.startsWith('audio/'));
  if (!file || uploading.value) return;

  uploading.value = true;
  error.value = '';

  try {
    if (isAnswerMediaTooLarge(file)) {
      throw new Error(`Файл «${file.name}» слишком большой. Максимум ${formatMaxAnswerMediaSize()}`);
    }
    const result = await adminUploadAnswerMedia(file);
    url.value = result.url;
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

function removeAudio() {
  url.value = '';
}

function openPicker() {
  inputRef.value?.click();
}

function openGallery() {
  showGallery.value = true;
}

function onGallerySelect(selected: MediaLibraryItem[]) {
  const item = selected.find((entry) => entry.mimeType.startsWith('audio/'));
  if (!item) return;
  url.value = item.url;
}

const { dragOver, onDragEnter, onDragLeave, onDragOver, onDrop } = useMediaDropZone({
  accept: (file) => file.type.startsWith('audio/'),
  onFiles: uploadFiles,
  disabled: uploading,
  root: rootRef,
});
</script>

<template>
  <div
    ref="rootRef"
    class="question-audio"
    :class="{ 'question-audio--drag-over': dragOver }"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @dragover="onDragOver"
    @drop="onDrop"
  >
    <label class="label">Аудио</label>
    <p class="field-hint media-hint">
      Необязательно. Один аудиофайл к заданию. Перетащите файл сюда или загрузите новый — предыдущий заменится.
      Максимальный размер — {{ formatMaxAnswerMediaSize() }}.
    </p>

    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="url" class="audio-preview">
      <audio :src="url" controls preload="metadata" class="preview-audio" @click.stop />
      <button class="variants-remove" type="button" aria-label="Удалить" @click="removeAudio">
        ×
      </button>
    </div>

    <input
      ref="inputRef"
      class="media-file-input"
      type="file"
      accept="audio/*"
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
        {{ uploading ? 'Загрузка…' : url ? 'Заменить аудио' : 'Загрузить аудио' }}
      </button>
      <button class="btn btn-secondary" type="button" :disabled="uploading" @click="openGallery">
        <AdminIcon name="layers-icon" />
        Из галереи
      </button>
    </div>

    <MediaPickerModal
      :open="showGallery"
      filter="audio"
      :multiple="false"
      upload-mode="answer-media"
      @close="showGallery = false"
      @select="onGallerySelect"
    />
  </div>
</template>

<style scoped>
.question-audio {
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  outline: none;
}

.question-audio--drag-over {
  border-color: #4f46e5;
  background: #f5f3ff;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.media-hint {
  margin-top: 0;
}

.audio-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  max-width: 420px;
}

.preview-audio {
  width: min(100%, 320px);
  flex: 1;
  min-width: 0;
}

.variants-remove {
  border: none;
  background: none;
  color: #6b7280;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.125rem 0.35rem;
  flex-shrink: 0;
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
