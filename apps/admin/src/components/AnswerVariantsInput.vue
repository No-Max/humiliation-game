<script setup lang="ts">
import { ref } from 'vue';

const variants = defineModel<string[]>({ default: () => [] });

const draft = ref('');
const duplicateHint = ref(false);

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function isDuplicate(value: string) {
  const normalized = normalize(value);
  return variants.value.some((item) => normalize(item) === normalized);
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
      Дополнительные формулировки, которые тоже засчитаются. Регистр и лишние пробелы не важны.
    </p>

    <ul v-if="variants.length" class="variants-list">
      <li v-for="(variant, index) in variants" :key="`${variant}-${index}`" class="variants-item">
        <span>{{ variant }}</span>
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
        + Добавить
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
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 0.9375rem;
}

.variants-remove {
  border: none;
  background: none;
  color: #6b7280;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.125rem 0.25rem;
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
