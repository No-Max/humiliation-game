<script setup lang="ts">
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
      <button
        v-if="!readonly"
        class="choice-btn"
        :class="{ selected: selected === choice }"
        type="button"
        @click="emit('select', choice)"
      >
        <span class="choice-label">{{ String.fromCharCode(65 + index) }}</span>
        <span>{{ choice }}</span>
      </button>
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
  display: flex;
  flex-wrap: wrap;
}

.question-choices > li {
  width: 50%;
  padding: 8px;
  box-sizing: border-box;
}

.choice-btn,
.choice-readonly {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  text-align: left;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 16px;
  line-height: 1.35;
  box-sizing: border-box;
}

.choice-btn > span:last-child,
.choice-readonly > span:last-child {
  min-width: 0;
  word-break: break-word;
  margin-left: 12px;
}

.choice-btn {
  border: 2px solid #e5e7eb;
  background: #fff;
  color: inherit;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.choice-btn:hover {
  border-color: #c7d2fe;
  background: #eef2ff;
}

.choice-btn.selected {
  border-color: #4f46e5;
  background: #eef2ff;
}

.choice-readonly {
  border: 2px solid #e5e7eb;
  background: #f9fafb;
}

.question-choices-large .choice-btn,
.question-choices-large .choice-readonly {
  padding: 16px 20px;
  font-size: 20px;
}

.choice-label {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #e5e7eb;
  font-weight: 700;
  font-size: 14px;
  margin-right: 0;
}

.choice-btn.selected .choice-label {
  background: #4f46e5;
  color: #fff;
}
</style>
