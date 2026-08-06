<script setup lang="ts">
import { ref } from 'vue';

const hints = defineModel<string[]>({ default: () => [] });

const draft = ref('');

function addHint() {
  const value = draft.value.trim();
  if (!value) return;

  hints.value = [...hints.value, value];
  draft.value = '';
}

function removeHint(index: number) {
  hints.value = hints.value.filter((_, i) => i !== index);
}

function moveHint(index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= hints.value.length) return;

  const next = [...hints.value];
  [next[index], next[target]] = [next[target], next[index]];
  hints.value = next;
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
      Первая — после 1-го круга ответов, следующие — после каждого неверного ответа.
    </p>

    <ul v-if="hints.length" class="variants-list">
      <li v-for="(hint, index) in hints" :key="`${hint}-${index}`" class="variants-item">
        <span class="hint-order">{{ index + 1 }}</span>
        <span class="hint-text">{{ hint }}</span>
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
        + Добавить
      </button>
    </div>
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
  border-radius: 999px;
  background: #fde68a;
  color: #92400e;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.hint-text {
  flex: 1;
  min-width: 0;
}

.hint-actions {
  display: flex;
  gap: 0.125rem;
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
</style>
