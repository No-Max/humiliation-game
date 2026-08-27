<script setup lang="ts">
import { ref } from 'vue';
import type { QuestionChoice } from '@humiliation-game/shared';
import { adminUpload } from '../lib/api';
import AdminIcon from './AdminIcon.vue';
import MediaPickerModal from './MediaPickerModal.vue';
import type { MediaLibraryItem } from '../lib/mediaLibrary';

const choices = defineModel<QuestionChoice[]>({ default: () => [] });

const draft = ref('');
const duplicateHint = ref(false);
const galleryIndex = ref<number | null>(null);
const uploadingIndex = ref<number | null>(null);
const uploadError = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);
const pendingUploadIndex = ref<number | null>(null);

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function isDuplicate(value: string, skipIndex?: number) {
  const normalized = normalize(value);
  return choices.value.some(
    (item, index) => index !== skipIndex && normalize(item.text) === normalized,
  );
}

function addChoice() {
  const value = draft.value.trim();
  duplicateHint.value = false;
  uploadError.value = '';

  if (!value) return;

  if (isDuplicate(value)) {
    duplicateHint.value = true;
    return;
  }

  choices.value = [...choices.value, { text: value }];
  draft.value = '';
}

function removeChoice(index: number) {
  choices.value = choices.value.filter((_, i) => i !== index);
}

function updateChoiceText(index: number, text: string) {
  const next = [...choices.value];
  next[index] = { ...next[index], text };
  choices.value = next;
}

function removeChoiceImage(index: number) {
  const next = [...choices.value];
  next[index] = { text: next[index].text, imageUrl: undefined };
  choices.value = next;
}

function openGallery(index: number) {
  galleryIndex.value = index;
}

function onGallerySelect(items: MediaLibraryItem[]) {
  const index = galleryIndex.value;
  galleryIndex.value = null;
  if (index == null || !items.length) return;

  const next = [...choices.value];
  next[index] = { ...next[index], imageUrl: items[0].url };
  choices.value = next;
}

function openUpload(index: number) {
  pendingUploadIndex.value = index;
  fileInputRef.value?.click();
}

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';

  const index = pendingUploadIndex.value;
  pendingUploadIndex.value = null;
  if (index == null || !file) return;

  if (!file.type.startsWith('image/')) {
    uploadError.value = 'Можно загружать только изображения';
    return;
  }

  uploadingIndex.value = index;
  uploadError.value = '';

  try {
    const result = await adminUpload(file);
    const next = [...choices.value];
    next[index] = { ...next[index], imageUrl: result.url };
    choices.value = next;
  } catch (e) {
    uploadError.value = e instanceof Error ? e.message : 'Ошибка загрузки';
  } finally {
    uploadingIndex.value = null;
  }
}

function onDraftKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault();
    addChoice();
  }
}
</script>

<template>
  <div class="choices-input">
    <label class="label">Варианты ответов</label>
    <p class="field-hint choices-hint">
      Минимум 2 варианта. Можно редактировать текст и добавить картинку к каждому варианту.
    </p>

    <ul v-if="choices.length" class="choices-list">
      <li v-for="(choice, index) in choices" :key="`${index}-${choice.text}`" class="choices-item">
        <div class="choices-item-main">
          <input
            :value="choice.text"
            class="input choices-text"
            type="text"
            placeholder="Текст варианта"
            @input="updateChoiceText(index, ($event.target as HTMLInputElement).value)"
          />

          <div class="choices-media">
            <img
              v-if="choice.imageUrl"
              :src="choice.imageUrl"
              alt=""
              class="choices-preview"
            />
            <div class="choices-media-actions">
              <button
                class="btn btn-secondary btn-small"
                type="button"
                :disabled="uploadingIndex === index"
                @click="openGallery(index)"
              >
                <AdminIcon name="layers-icon" />
                {{ choice.imageUrl ? 'Заменить' : 'Из галереи' }}
              </button>
              <button
                class="btn btn-secondary btn-small"
                type="button"
                :disabled="uploadingIndex === index"
                @click="openUpload(index)"
              >
                <AdminIcon name="publish-icon" />
                {{ uploadingIndex === index ? 'Загрузка…' : 'Загрузить' }}
              </button>
              <button
                v-if="choice.imageUrl"
                class="btn btn-secondary btn-small"
                type="button"
                @click="removeChoiceImage(index)"
              >
                <AdminIcon name="close-icon" />
                Убрать картинку
              </button>
            </div>
          </div>
        </div>

        <button
          class="choices-remove"
          type="button"
          aria-label="Удалить вариант"
          @click="removeChoice(index)"
        >
          ×
        </button>
      </li>
    </ul>

    <div class="choices-add">
      <input
        v-model="draft"
        class="input choices-draft"
        type="text"
        placeholder="Например: Бильбо"
        @keydown="onDraftKeydown"
      />
      <button class="btn btn-secondary" type="button" @click="addChoice">
        <AdminIcon name="plus-icon" />
        Добавить
      </button>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      hidden
      @change="onFileSelected"
    />

    <MediaPickerModal
      :open="galleryIndex != null"
      :multiple="false"
      filter="image"
      @close="galleryIndex = null"
      @select="onGallerySelect"
    />

    <p v-if="duplicateHint" class="error choices-error">Такой вариант уже есть</p>
    <p v-if="uploadError" class="error choices-error">{{ uploadError }}</p>
  </div>
</template>

<style scoped>
.choices-input {
  margin-bottom: 0.75rem;
}

.choices-hint {
  margin-top: 0;
}

.choices-list {
  list-style: none;
  padding: 0;
  margin: 0 0 0.75rem;
  display: grid;
  gap: 0.75rem;
}

.choices-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f3f4f6;
  border-radius: 8px;
}

.choices-item-main {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.75rem;
}

.choices-text {
  margin-bottom: 0;
}

.choices-media {
  display: grid;
  gap: 0.5rem;
}

.choices-preview {
  display: block;
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
}

.choices-media-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.btn-small {
  padding: 0.35rem 0.65rem;
  font-size: 0.8125rem;
}

.choices-remove {
  border: none;
  background: none;
  color: #6b7280;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.125rem 0.25rem;
  flex-shrink: 0;
}

.choices-remove:hover {
  color: #dc2626;
}

.choices-add {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.choices-draft {
  margin-bottom: 0;
  flex: 1;
}

.choices-error {
  margin-top: 0.5rem;
  margin-bottom: 0;
}
</style>
