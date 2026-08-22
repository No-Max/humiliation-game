<script setup lang="ts">
import Button from './Button.vue';

defineProps<{
  choices: string[];
  selected?: string;
  readonly?: boolean;
  large?: boolean;
}>();

const emit = defineEmits<{
  select: [choice: string];
}>();
</script>

<template>
  <ul class="question-choices" :class="{ 'question-choices-large': large }">
    <li v-for="(choice, index) in choices" :key="`${index}-${choice}`">
      <Button
        v-if="!readonly"
        variant="choice"
        :large="large"
        :selected="selected === choice"
        @click="emit('select', choice)"
      >
        <span class="choice-label">{{ String.fromCharCode(65 + index) }}</span>
        <span>{{ choice }}</span>
      </Button>
      <div v-else class="choice-readonly">
        <span class="choice-label">{{ String.fromCharCode(65 + index) }}</span>
        <span>{{ choice }}</span>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.question-choices {
  list-style: none;
  padding: 0;
  margin: -8px;
  display: block;
  text-align: center;
  font-size: 0;
}

.question-choices > li {
  display: inline-block;
  vertical-align: top;
  width: 50%;
  padding: 8px;
  box-sizing: border-box;
  font-size: 16px;
}

.btn--choice > span:last-child,
.choice-readonly > span:last-child {
  display: inline-block;
  vertical-align: middle;
  min-width: 0;
  width: calc(100% - 40px);
  word-break: break-word;
  margin-left: 12px;
}

.choice-readonly {
  width: 100%;
  min-width: 0;
  display: block;
  text-align: left;
  padding: 12px 16px;
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
  margin-right: 0;
}

.btn--selected .choice-label {
  background: #4f46e5;
  color: #fff;
}
</style>
