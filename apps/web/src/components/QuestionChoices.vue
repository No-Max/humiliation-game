<script setup lang="ts">
import type { QuestionChoice } from '@humiliation-game/shared';
import Button from './Button.vue';

defineProps<{
  choices: QuestionChoice[];
  selected?: string;
  readonly?: boolean;
  disabled?: boolean;
  large?: boolean;
}>();

const emit = defineEmits<{
  select: [choice: string];
}>();
</script>

<template>
  <ul class="question-choices" :class="{ 'question-choices-large': large }">
    <li
      v-for="(choice, index) in choices"
      :key="`${index}-${choice.text}`"
      class="question-choice"
    >
      <Button
        v-if="!readonly"
        variant="choice"
        :large="large"
        :selected="selected === choice.text"
        :disabled="disabled"
        @click="emit('select', choice.text)"
        class="choice-button"
      >
        <span class="choice-content">
          <span class="choice-content-inner">
            <span class="choice-label">{{ String.fromCharCode(65 + index) }}</span>
            <span>{{ choice.text }}</span>
          </span>
          <span class="choice-image-container">
            <img
              v-if="choice.imageUrl"
              :src="choice.imageUrl"
              alt=""
              class="choice-image"
            />
          </span>
        </span>
      </Button>
      <div v-else class="choice-readonly">
        <span class="choice-content">
          <span class="choice-content-inner">
            <span>{{ choice.text }}</span>
            <span class="choice-label">{{ String.fromCharCode(65 + index) }}</span>
          </span>
          <span class="choice-image-container">
            <img
              v-if="choice.imageUrl"
              :src="choice.imageUrl"
              alt=""
              class="choice-image"
            />
          </span>
        </span>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.question-choices {
  list-style: none;
  padding: 0;
  margin-left: -8px;
  margin-right: -8px;
  display: block;
  font-size: 0;
  padding-top: 8px;
}

.question-choice {
  display: inline-block;
  vertical-align: top;
  width: 50%;
  max-width: 280px;
  padding: 8px 4px 0 4px;
  box-sizing: border-box;
  font-size: 16px;
  overflow: hidden;
}

.choice-readonly {
  width: 100%;
  min-width: 0;
  display: block;
  text-align: left;
  padding: 16px 8px 0 8px;
  border-radius: 10px;
  font-size: 16px;
  line-height: 1.35;
  box-sizing: border-box;
  border: 2px solid #e5e7eb;
  background: #f9fafb;
}

.question-choices-large .choice-readonly {
  padding: 16px 20px;
  font-size: 20px;
}

.choice-button {

}

.choice-label {
  width: 28px;
  height: 28px;
  display: inline-block;
  vertical-align: middle;
  text-align: center;
  line-height: 28px;
  border-radius: 999px;
  background: #e5e7eb;
  font-weight: bold;
  font-size: 14px;
  margin-right: 8px;
}

.btn--selected .choice-label {
  background: #4f46e5;
  color: #fff;
}

.choice-content {
  display: inline-block;
  align-items: center;
  gap: 10px;
  vertical-align: middle;
  min-width: 0;
  width: 100%;
  overflow: hidden;
}

.choice-image {
  height: 100%;
  flex-shrink: 0;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateY(-50%) translateX(-50%);
}

.question-choices-large .choice-image {
  width: 64px;
}

.choice-content-inner {
  display: block;
}

.choice-image-container {
  display: inline-block;
  width: 120px;
  height: 150px;
  overflow: hidden;
  position: relative;
  border-radius: 6px;
  margin-left: 36px;
  margin-top: 4px;
}

@media screen and (max-width: 1200px) {
  .question-choice {
    max-width: 50%;
  }
}

@media screen and (max-width: 768px) {
  .question-choice {
    max-width: 100%;
  }

  .choice-image-container {
    margin-left: 0;
  }
}
</style>
