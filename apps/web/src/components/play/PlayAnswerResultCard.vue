<script setup lang="ts">
import type { AnswerMediaItem } from '@humiliation-game/shared';
import AnswerRevealMedia from '../AnswerRevealMedia.vue';

defineProps<{
  phase: 'CORRECT' | 'REVEAL';
  questionValue: number;
  questionPrompt?: string;
  correctAnswer?: string;
  answerMedia?: AnswerMediaItem[];
  showNextQuestion?: boolean;
}>();

defineEmits<{
  nextQuestion: [];
}>();
</script>

<template>
  <div class="card answer-result-card">
    <div v-if="phase === 'CORRECT'" class="banner correct">
      Верно!
    </div>
    <div v-else class="banner wrong">Никто не угадал</div>
    <div
      v-if="questionPrompt"
      class="question-prompt rich-text-preview"
      v-html="questionPrompt"
    />
    <p v-if="correctAnswer">
      Правильный ответ: <strong>{{ correctAnswer }}</strong>
    </p>
    <AnswerRevealMedia :items="answerMedia" />
    <button
      v-if="showNextQuestion !== false"
      class="btn"
      type="button"
      @click="$emit('nextQuestion')"
    >Следующий вопрос</button>
  </div>
</template>

<style scoped>
.answer-result-card {
  margin-top: 1rem;
}

.question-prompt {
  margin: 0 0 1rem;
  font-size: 1.0625rem;
  line-height: 1.5;
  color: #374151;
}
</style>
