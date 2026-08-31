<script setup lang="ts">
import { ref } from 'vue';
import AdminIcon from './AdminIcon.vue';

const variants = defineModel<string[]>({ default: () => [] });

const draft = ref('');
const duplicateHint = ref(false);
const editErrors = ref<Record<number, string>>({});

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function isDuplicate(value: string, skipIndex?: number) {
  const normalized = normalize(value);
  return variants.value.some(
    (item, index) => index !== skipIndex && normalize(item) === normalized,
  );
}

function addVariant() {
  const value = draft.value.trim();
  duplicateHint.value = false;

  if (!value) return;

  if (isDuplicate(value)) {
    duplicateHint.value = true;
    return;
  }

  variants.value = [...variants.value, value];
  draft.value = '';
}

function removeVariant(index: number) {
  variants.value = variants.value.filter((_, i) => i !== index);
  const nextErrors: Record<number, string> = {};
  for (const [key, message] of Object.entries(editErrors.value)) {
    const i = Number(key);
    if (i < index) nextErrors[i] = message;
    if (i > index) nextErrors[i - 1] = message;
  }
  editErrors.value = nextErrors;
}

function commitVariant(index: number) {
  const trimmed = variants.value[index]?.trim() ?? '';
  duplicateHint.value = false;

  if (!trimmed) {
    removeVariant(index);
    return;
  }

  if (isDuplicate(trimmed, index)) {
    editErrors.value = { ...editErrors.value, [index]: 'Такой вариант уже есть' };
    return;
  }

  const next = [...variants.value];
  next[index] = trimmed;
  variants.value = next;

  const nextErrors = { ...editErrors.value };
  delete nextErrors[index];
  editErrors.value = nextErrors;
}

function onDraftKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault();
    addVariant();
  }
}
</script>

<template>
  <div class="variants-input">
    <label class="label">Синонимы и альтернативные ответы</label>
    <p class="field-hint variants-hint">
      Дополнительные формулировки, которые тоже засчитаются. Можно редактировать текст прямо в списке.
      Регистр и лишние пробелы не важны.
    </p>

    <ul v-if="variants.length" class="variants-list">
      <li v-for="(variant, index) in variants" :key="index" class="variants-item">
        <div class="variants-item-main">
          <input
            v-model="variants[index]"
            class="input variants-text"
            type="text"
            placeholder="Альтернативный ответ"
            @blur="commitVariant(index)"
            @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
          />
          <p v-if="editErrors[index]" class="error variants-item-error">{{ editErrors[index] }}</p>
        </div>
        <button
          class="variants-remove"
          type="button"
          aria-label="Удалить вариант"
          @click="removeVariant(index)"
        >
          ×
        </button>
      </li>
    </ul>

    <div class="variants-add">
      <input
        v-model="draft"
        class="input variants-draft"
        type="text"
        placeholder="Например: simply walk into mordor"
        @keydown="onDraftKeydown"
      />
      <button class="btn btn-secondary" type="button" @click="addVariant">
        <AdminIcon name="plus-icon" />
        Добавить
      </button>
    </div>

    <p v-if="duplicateHint" class="error variants-error">Такой вариант уже есть</p>
  </div>
</template>

<style scoped>
.variants-input {
  margin-bottom: 0.75rem;
}

.variants-hint {
  margin-top: 0;
}

.variants-list {
  list-style: none;
  padding: 0;
  margin: 0 0 0.75rem;
  display: grid;
  gap: 0.5rem;
}

.variants-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #f3f4f6;
  border-radius: 6px;
}

.variants-item-main {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.35rem;
}

.variants-text {
  margin-bottom: 0;
}

.variants-item-error {
  margin: 0;
  font-size: 0.8125rem;
}

.variants-remove {
  border: none;
  background: none;
  color: #6b7280;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.125rem 0.25rem;
  flex-shrink: 0;
}

.variants-remove:hover {
  color: #dc2626;
}

.variants-add {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.variants-draft {
  margin-bottom: 0;
  flex: 1;
}

.variants-error {
  margin-top: 0.5rem;
  margin-bottom: 0;
}
</style>
