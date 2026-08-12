<script setup lang="ts">
import { ref } from 'vue';
import AdminIcon from './AdminIcon.vue';

const choices = defineModel<string[]>({ default: () => [] });

const draft = ref('');
const duplicateHint = ref(false);

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function isDuplicate(value: string) {
  const normalized = normalize(value);
  return choices.value.some((item) => normalize(item) === normalized);
}

function addChoice() {
  const value = draft.value.trim();
  duplicateHint.value = false;

  if (!value) return;

  if (isDuplicate(value)) {
    duplicateHint.value = true;
    return;
  }

  choices.value = [...choices.value, value];
  draft.value = '';
}

function removeChoice(index: number) {
  choices.value = choices.value.filter((_, i) => i !== index);
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
      Минимум 2 варианта. Игроки выбирают один из них на экране.
    </p>

    <ul v-if="choices.length" class="choices-list">
      <li v-for="(choice, index) in choices" :key="`${choice}-${index}`" class="choices-item">
        <span>{{ choice }}</span>
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

    <p v-if="duplicateHint" class="error choices-error">Такой вариант уже есть</p>
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
  gap: 0.5rem;
}

.choices-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 0.9375rem;
}

.choices-remove {
  border: none;
  background: none;
  color: #6b7280;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.125rem 0.25rem;
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
