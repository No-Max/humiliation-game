<script setup lang="ts">
import { ref } from 'vue';
import AdminIcon from './AdminIcon.vue';

const hints = defineModel<string[]>({ default: () => [] });

const draft = ref('');
const duplicateHint = ref(false);
const editErrors = ref<Record<number, string>>({});

function isDuplicate(value: string, skipIndex?: number) {
  const normalized = value.trim().toLowerCase();
  return hints.value.some(
    (item, index) => index !== skipIndex && item.trim().toLowerCase() === normalized,
  );
}

function addHint() {
  const value = draft.value.trim();
  duplicateHint.value = false;

  if (!value) return;

  if (isDuplicate(value)) {
    duplicateHint.value = true;
    return;
  }

  hints.value = [...hints.value, value];
  draft.value = '';
}

function removeHint(index: number) {
  hints.value = hints.value.filter((_, i) => i !== index);
  const nextErrors: Record<number, string> = {};
  for (const [key, message] of Object.entries(editErrors.value)) {
    const i = Number(key);
    if (i < index) nextErrors[i] = message;
    if (i > index) nextErrors[i - 1] = message;
  }
  editErrors.value = nextErrors;
}

function commitHint(index: number) {
  const trimmed = hints.value[index]?.trim() ?? '';
  duplicateHint.value = false;

  if (!trimmed) {
    removeHint(index);
    return;
  }

  if (isDuplicate(trimmed, index)) {
    editErrors.value = { ...editErrors.value, [index]: 'Такая подсказка уже есть' };
    return;
  }

  const next = [...hints.value];
  next[index] = trimmed;
  hints.value = next;

  const nextErrors = { ...editErrors.value };
  delete nextErrors[index];
  editErrors.value = nextErrors;
}

function moveHint(index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= hints.value.length) return;

  const next = [...hints.value];
  [next[index], next[target]] = [next[target], next[index]];
  hints.value = next;

  const nextErrors: Record<number, string> = {};
  for (const [key, message] of Object.entries(editErrors.value)) {
    const i = Number(key);
    if (i === index) nextErrors[target] = message;
    else if (i === target) nextErrors[index] = message;
    else nextErrors[i] = message;
  }
  editErrors.value = nextErrors;
}

function onDraftKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault();
    addHint();
  }
}
</script>

<template>
  <div class="variants-input">
    <label class="label">Подсказки</label>
    <p class="field-hint variants-hint">
      Подсказка после каждого круга ответов. Можно редактировать текст прямо в списке.
    </p>

    <ul v-if="hints.length" class="variants-list">
      <li v-for="(hint, index) in hints" :key="index" class="variants-item">
        <span class="hint-order">{{ index + 1 }}</span>
        <div class="hint-item-main">
          <input
            v-model="hints[index]"
            class="input hint-text"
            type="text"
            placeholder="Текст подсказки"
            @blur="commitHint(index)"
            @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
          />
          <p v-if="editErrors[index]" class="error hint-item-error">{{ editErrors[index] }}</p>
        </div>
        <div class="hint-actions">
          <button
            class="variants-move"
            type="button"
            :disabled="index === 0"
            aria-label="Выше"
            @click="moveHint(index, -1)"
          >
            ↑
          </button>
          <button
            class="variants-move"
            type="button"
            :disabled="index === hints.length - 1"
            aria-label="Ниже"
            @click="moveHint(index, 1)"
          >
            ↓
          </button>
          <button
            class="variants-remove"
            type="button"
            aria-label="Удалить подсказку"
            @click="removeHint(index)"
          >
            ×
          </button>
        </div>
      </li>
    </ul>

    <div class="variants-add">
      <input
        v-model="draft"
        class="input variants-draft"
        type="text"
        placeholder="Текст подсказки"
        @keydown="onDraftKeydown"
      />
      <button class="btn btn-secondary" type="button" @click="addHint">
        <AdminIcon name="plus-icon" />
        Добавить
      </button>
    </div>

    <p v-if="duplicateHint" class="error variants-error">Такая подсказка уже есть</p>
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
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #fef3c7;
  border-radius: 6px;
  font-size: 0.9375rem;
}

.hint-order {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  margin-top: 0.35rem;
  border-radius: 999px;
  background: #fde68a;
  color: #92400e;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.hint-item-main {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.35rem;
}

.hint-text {
  margin-bottom: 0;
}

.hint-item-error {
  margin: 0;
  font-size: 0.8125rem;
}

.hint-actions {
  display: flex;
  gap: 0.125rem;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.variants-move,
.variants-remove {
  border: none;
  background: none;
  color: #6b7280;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.125rem 0.25rem;
}

.variants-move:disabled {
  opacity: 0.35;
  cursor: not-allowed;
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
