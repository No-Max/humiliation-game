<script setup lang="ts">
import { ref } from 'vue';
import { adminUpload } from '../lib/api';
import AdminIcon from './AdminIcon.vue';

type AnswerMediaType = 'IMAGE' | 'AUDIO' | 'VIDEO';

interface AnswerMediaItem {
  url: string;
  type: AnswerMediaType;
}

const items = defineModel<AnswerMediaItem[]>({ default: () => [] });

const uploading = ref(false);
const error = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

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

async function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = '';
  if (!files.length) return;

  uploading.value = true;
  error.value = '';

  try {
    const uploaded: AnswerMediaItem[] = [];
    for (const file of files) {
      const kind = mimeToType(file.type);
      if (!kind) {
        throw new Error('Можно загружать только изображения, аудио или видео');
      }
      const result = await adminUpload(file);
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
</script>

<template>
  <div class="answer-media">
    <label class="label">Медиа правильного ответа</label>
    <p class="field-hint media-hint">
      Необязательно. Несколько картинок, аудио или видео — на экране правильного ответа:
      и когда кто-то ответил верно, и когда никто не угадал.
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
    <button
      class="btn btn-secondary"
      type="button"
      :disabled="uploading"
      @click="openPicker"
    >
      <AdminIcon name="publish-icon" />
      {{ uploading ? 'Загрузка…' : 'Загрузить файлы' }}
    </button>
  </div>
</template>

<style scoped>
.answer-media {
  margin-bottom: 0.75rem;
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
</style>
