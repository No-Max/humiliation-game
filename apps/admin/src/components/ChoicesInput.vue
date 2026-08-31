<script setup lang="ts">
import { ref } from 'vue';
import type { QuestionChoice } from '@humiliation-game/shared';
import AdminIcon from './AdminIcon.vue';
import ChoiceImageInput from './ChoiceImageInput.vue';

const choices = defineModel<QuestionChoice[]>({ default: () => [] });

const draft = ref('');
const duplicateHint = ref(false);
const DEFAULT_CHOICE_PREFIX = 'Вариант ';

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function isDuplicate(value: string, skipIndex?: number) {
  const normalized = normalize(value);
  return choices.value.some(
    (item, index) => index !== skipIndex && normalize(item.text) === normalized,
  );
}

function nextDefaultChoiceText() {
  let number = 1;
  while (isDuplicate(`${DEFAULT_CHOICE_PREFIX}${number}`)) {
    number += 1;
  }
  return `${DEFAULT_CHOICE_PREFIX}${number}`;
}

function addChoice() {
  duplicateHint.value = false;
  const value = draft.value.trim() || nextDefaultChoiceText();

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
      Минимум 2 варианта. Можно добавить без текста — подставится «Вариант 1», «Вариант 2» и т.д.
    </p>

    <ul v-if="choices.length" class="choices-list">
      <li v-for="(choice, index) in choices" :key="index" class="choices-item">
        <div class="choices-item-main">
          <input
            v-model="choices[index].text"
            class="input choices-text"
            type="text"
            placeholder="Текст варианта"
          />

          <ChoiceImageInput v-model="choices[index].imageUrl" />
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
        placeholder="Текст или пусто — «Вариант N»"
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
