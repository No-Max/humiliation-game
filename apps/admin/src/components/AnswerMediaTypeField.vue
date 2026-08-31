<script setup lang="ts">
import { computed, ref } from 'vue';
import { adminUploadAnswerMedia } from '../lib/api';
import { filesFromClipboard, focusPasteBlock } from '../lib/useClipboardFiles';
import { useMediaDropZone } from '../lib/useMediaDropZone';
import {
  formatMaxAnswerMediaSize,
  isAnswerMediaTooLarge,
} from '../lib/uploadLimits';
import type { MediaKind } from '../lib/mediaLibrary';
import AdminIcon from './AdminIcon.vue';
import MediaPickerModal from './MediaPickerModal.vue';
import type { MediaLibraryItem } from '../lib/mediaLibrary';

type AnswerMediaType = 'IMAGE' | 'AUDIO' | 'VIDEO';

interface AnswerMediaItem {
  url: string;
  type: AnswerMediaType;
}

const props = defineProps<{
  type: AnswerMediaType;
  label: string;
  hint: string;
  items: AnswerMediaItem[];
}>();

const emit = defineEmits<{
  'update:items': [AnswerMediaItem[]];
}>();

const typeItems = computed({
  get: () => props.items.filter((item) => item.type === props.type),
  set: (next) => emit('update:items', next),
});

const mediaKind = computed<MediaKind>(() => {
  if (props.type === 'IMAGE') return 'image';
  if (props.type === 'AUDIO') return 'audio';
  return 'video';
});

const accept = computed(() => {
  if (props.type === 'IMAGE') return 'image/*';
  if (props.type === 'AUDIO') return 'audio/*';
  return 'video/*';
});

const uploadLabel = computed(() => {
  if (props.type === 'IMAGE') return 'Загрузить картинки';
  if (props.type === 'AUDIO') return 'Загрузить аудио';
  return 'Загрузить видео';
});

const allowMultiple = computed(() => props.type === 'IMAGE');

const uploading = ref(false);
const error = ref('');
const showGallery = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const rootRef = ref<HTMLElement | null>(null);

function matchesType(mime: string): boolean {
  const type = String(mime ?? '');
  if (props.type === 'IMAGE') return type.startsWith('image/');
  if (props.type === 'AUDIO') return type.startsWith('audio/');
  return type.startsWith('video/');
}

async function uploadFiles(files: File[]) {
  if (!files.length || uploading.value) return;

  uploading.value = true;
  error.value = '';

  try {
    const selectedFiles = allowMultiple.value ? files : files.slice(0, 1);
    const uploaded: AnswerMediaItem[] = [];
    for (const file of selectedFiles) {
      if (!matchesType(file.type)) {
        throw new Error(`Можно загружать только ${props.label.toLowerCase()}`);
      }
      if (isAnswerMediaTooLarge(file)) {
        throw new Error(`Файл «${file.name}» слишком большой. Максимум ${formatMaxAnswerMediaSize()}`);
      }
      const result = await adminUploadAnswerMedia(file);
      uploaded.push({ url: result.url, type: props.type });
    }
    typeItems.value = allowMultiple.value ? [...typeItems.value, ...uploaded] : uploaded;
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
  if (props.type !== 'IMAGE') return;
  const files = filesFromClipboard(event).filter((file) => matchesType(file.type));
  if (!files.length) return;
  event.preventDefault();
  await uploadFiles(files);
}

function focusBlock(event: MouseEvent) {
  focusPasteBlock(event, rootRef.value);
}

function removeAt(index: number) {
  typeItems.value = typeItems.value.filter((_, i) => i !== index);
}

function moveAt(index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= typeItems.value.length) return;
  const next = [...typeItems.value];
  [next[index], next[target]] = [next[target], next[index]];
  typeItems.value = next;
}

function openPicker() {
  inputRef.value?.click();
}

function openGallery() {
  showGallery.value = true;
}

function onGallerySelect(selected: MediaLibraryItem[]) {
  const valid = selected.filter((item) => matchesType(item.mimeType));
  if (!valid.length) return;

  if (allowMultiple.value) {
    const existing = new Set(typeItems.value.map((item) => item.url));
    const added = valid.flatMap((item) => {
      if (existing.has(item.url)) return [];
      existing.add(item.url);
      return [{ url: item.url, type: props.type }];
    });
    typeItems.value = [...typeItems.value, ...added];
    return;
  }

  typeItems.value = [{ url: valid[0].url, type: props.type }];
}

const { dragOver, onDragEnter, onDragLeave, onDragOver, onDrop } = useMediaDropZone({
  accept: (file) => matchesType(file.type),
  onFiles: uploadFiles,
  disabled: uploading,
  root: rootRef,
});
</script>

<template>
  <div
    ref="rootRef"
    class="answer-media-field"
    :class="{ 'answer-media-field--drag-over': dragOver }"
    tabindex="0"
    @mousedown="focusBlock"
    @paste="onPaste"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @dragover="onDragOver"
    @drop="onDrop"
  >
    <label class="label">{{ label }}</label>
    <p class="field-hint media-hint">{{ hint }}</p>

    <p v-if="error" class="error">{{ error }}</p>

    <ul
      v-if="typeItems.length"
      class="media-list"
      :class="{ 'media-list--images': type === 'IMAGE' }"
    >
      <li
        v-for="(item, index) in typeItems"
        :key="`${item.url}-${index}`"
        class="media-item"
        :class="{ 'media-item--image': type === 'IMAGE' }"
      >
        <img
          v-if="type === 'IMAGE'"
          :src="item.url"
          alt=""
          class="media-thumb"
        />
        <audio
          v-else-if="type === 'AUDIO'"
          :src="item.url"
          controls
          preload="metadata"
          class="preview-audio"
          @click.stop
        />
        <video
          v-else
          :src="item.url"
          controls
          preload="metadata"
          class="preview-video"
          @click.stop
        />
        <div class="media-actions" :class="{ 'media-actions--image': type === 'IMAGE' }">
          <button
            v-if="type === 'IMAGE'"
            class="variants-move"
            type="button"
            :disabled="index === 0"
            aria-label="Левее"
            @click="moveAt(index, -1)"
          >
            ←
          </button>
          <button
            v-if="type === 'IMAGE'"
            class="variants-move"
            type="button"
            :disabled="index === typeItems.length - 1"
            aria-label="Правее"
            @click="moveAt(index, 1)"
          >
            →
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
      :accept="accept"
      :multiple="allowMultiple"
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
        {{ uploading ? 'Загрузка…' : uploadLabel }}
      </button>
      <button class="btn btn-secondary" type="button" :disabled="uploading" @click="openGallery">
        <AdminIcon name="layers-icon" />
        Из галереи
      </button>
    </div>

    <MediaPickerModal
      :open="showGallery"
      :filter="mediaKind"
      :multiple="allowMultiple"
      upload-mode="answer-media"
      @close="showGallery = false"
      @select="onGallerySelect"
    />
  </div>
</template>

<style scoped>
.answer-media-field {
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  outline: none;
  cursor: pointer;
}

.answer-media-field:focus,
.answer-media-field:focus-within,
.answer-media-field--drag-over {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
  cursor: default;
}

.answer-media-field--drag-over {
  background: #f5f3ff;
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

.media-list--images {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.75rem;
  max-width: none;
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

.media-item--image {
  position: relative;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  width: 140px;
  padding: 0;
  overflow: hidden;
}

.media-thumb {
  display: block;
  width: 100%;
  height: 100px;
  object-fit: cover;
  background: #e5e7eb;
}

.preview-audio {
  width: min(100%, 240px);
  flex: 1;
  min-width: 0;
}

.preview-video {
  display: block;
  width: min(100%, 240px);
  height: 72px;
  object-fit: contain;
  border-radius: 4px;
  background: #111827;
  flex-shrink: 0;
}

.media-actions {
  display: flex;
  gap: 0.125rem;
  margin-left: auto;
  flex-shrink: 0;
}

.media-actions--image {
  justify-content: center;
  margin-left: 0;
  padding: 0.25rem;
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
