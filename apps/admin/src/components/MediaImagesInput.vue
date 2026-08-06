<script setup lang="ts">
import { ref } from 'vue';
import { adminUpload } from '../lib/api';

const urls = defineModel<string[]>({ default: () => [] });

const uploading = ref(false);
const error = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

async function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = '';
  if (!files.length) return;

  uploading.value = true;
  error.value = '';

  try {
    const uploaded: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        throw new Error('Можно загружать только изображения');
      }
      const result = await adminUpload(file);
      uploaded.push(result.url);
    }
    urls.value = [...urls.value, ...uploaded];
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка загрузки';
  } finally {
    uploading.value = false;
  }
}

function removeAt(index: number) {
  urls.value = urls.value.filter((_, i) => i !== index);
}

function moveAt(index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= urls.value.length) return;
  const next = [...urls.value];
  [next[index], next[target]] = [next[target], next[index]];
  urls.value = next;
}

function openPicker() {
  inputRef.value?.click();
}
</script>

<template>
  <div class="media-input">
    <label class="label">Картинки</label>
    <p class="field-hint media-hint">
      Одна или несколько — в игре отобразятся в ряд.
    </p>

    <p v-if="error" class="error">{{ error }}</p>

    <ul v-if="urls.length" class="media-list">
      <li v-for="(url, index) in urls" :key="`${url}-${index}`" class="media-item">
        <img :src="url" alt="" class="media-thumb" />
        <div class="media-actions">
          <button
            class="variants-move"
            type="button"
            :disabled="index === 0"
            aria-label="Левее"
            @click="moveAt(index, -1)"
          >
            ←
          </button>
          <button
            class="variants-move"
            type="button"
            :disabled="index === urls.length - 1"
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
      accept="image/*"
      multiple
      @change="onFilesSelected"
    />
    <button
      class="btn btn-secondary"
      type="button"
      :disabled="uploading"
      @click="openPicker"
    >
      {{ uploading ? 'Загрузка…' : '+ Загрузить картинки' }}
    </button>
  </div>
</template>

<style scoped>
.media-input {
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
  flex-wrap: wrap;
  gap: 0.75rem;
}

.media-item {
  position: relative;
  width: 140px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.media-thumb {
  display: block;
  width: 100%;
  height: 100px;
  object-fit: cover;
  background: #e5e7eb;
}

.media-actions {
  display: flex;
  justify-content: center;
  gap: 0.125rem;
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
</style>
