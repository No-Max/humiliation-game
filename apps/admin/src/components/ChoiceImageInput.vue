<script setup lang="ts">
import { computed, ref } from 'vue';
import { adminUpload } from '../lib/api';
import { filesFromClipboard, focusPasteBlock } from '../lib/useClipboardFiles';
import { useMediaDropZone } from '../lib/useMediaDropZone';
import AdminIcon from './AdminIcon.vue';
import MediaPickerModal from './MediaPickerModal.vue';
import type { MediaLibraryItem } from '../lib/mediaLibrary';

const imageUrl = defineModel<string | undefined>();

const uploading = ref(false);
const error = ref('');
const showGallery = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const rootRef = ref<HTMLElement | null>(null);

const uploadingRef = computed(() => uploading.value);

async function uploadFile(file: File) {
  if (!file.type.startsWith('image/')) {
    error.value = 'Можно загружать только изображения';
    return;
  }

  uploading.value = true;
  error.value = '';

  try {
    const result = await adminUpload(file);
    imageUrl.value = result.url;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка загрузки';
  } finally {
    uploading.value = false;
  }
}

async function uploadFiles(files: File[]) {
  const file = files.find((item) => item.type.startsWith('image/'));
  if (!file) return;
  await uploadFile(file);
}

async function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  await uploadFile(file);
}

async function onPaste(event: ClipboardEvent) {
  const files = filesFromClipboard(event).filter((file) => file.type.startsWith('image/'));
  if (!files.length) return;
  event.preventDefault();
  await uploadFiles(files);
}

function focusBlock(event: MouseEvent) {
  focusPasteBlock(event, rootRef.value);
}

function removeImage() {
  imageUrl.value = undefined;
}

function openPicker() {
  inputRef.value?.click();
}

function openGallery() {
  showGallery.value = true;
}

function onGallerySelect(items: MediaLibraryItem[]) {
  if (!items.length) return;
  imageUrl.value = items[0].url;
}

const { dragOver, onDragEnter, onDragLeave, onDragOver, onDrop } = useMediaDropZone({
  accept: (file) => file.type.startsWith('image/'),
  onFiles: uploadFiles,
  disabled: uploadingRef,
  root: rootRef,
});
</script>

<template>
  <div
    ref="rootRef"
    class="choice-image-input"
    :class="{ 'choice-image-input--drag-over': dragOver }"
    tabindex="0"
    @mousedown="focusBlock"
    @paste="onPaste"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @dragover="onDragOver"
    @drop="onDrop"
  >
    <p class="field-hint choice-image-hint">
      Картинка необязательна. Перетащите файл сюда, загрузите или вставьте из буфера (Ctrl/⌘+V).
    </p>

    <p v-if="error" class="error">{{ error }}</p>

    <img
      v-if="imageUrl"
      :src="imageUrl"
      alt=""
      class="choice-image-preview"
    />

    <input
      ref="inputRef"
      class="choice-image-file-input"
      type="file"
      accept="image/*"
      @change="onFilesSelected"
    />

    <div class="choice-image-actions">
      <button
        class="btn btn-secondary btn-small"
        type="button"
        :disabled="uploading"
        @click="openPicker"
      >
        <AdminIcon name="publish-icon" />
        {{ uploading ? 'Загрузка…' : imageUrl ? 'Заменить' : 'Загрузить' }}
      </button>
      <button
        class="btn btn-secondary btn-small"
        type="button"
        :disabled="uploading"
        @click="openGallery"
      >
        <AdminIcon name="layers-icon" />
        Из галереи
      </button>
      <button
        v-if="imageUrl"
        class="btn btn-secondary btn-small"
        type="button"
        :disabled="uploading"
        @click="removeImage"
      >
        <AdminIcon name="close-icon" />
        Убрать
      </button>
    </div>

    <MediaPickerModal
      :open="showGallery"
      :multiple="false"
      filter="image"
      upload-mode="image"
      @close="showGallery = false"
      @select="onGallerySelect"
    />
  </div>
</template>

<style scoped>
.choice-image-input {
  padding: 0.75rem;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  outline: none;
  cursor: pointer;
}

.choice-image-input:focus,
.choice-image-input:focus-within,
.choice-image-input--drag-over {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
  cursor: default;
}

.choice-image-input--drag-over {
  background: #f5f3ff;
}

.choice-image-hint {
  margin: 0 0 0.5rem;
}

.choice-image-preview {
  display: block;
  width: 140px;
  height: 100px;
  margin-bottom: 0.75rem;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

.choice-image-file-input {
  display: none;
}

.choice-image-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.btn-small {
  padding: 0.35rem 0.65rem;
  font-size: 0.8125rem;
}
</style>
