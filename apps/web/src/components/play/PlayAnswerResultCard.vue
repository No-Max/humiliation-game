<script setup lang="ts">
import type { AnswerMediaItem } from '@humiliation-game/shared';
import AnswerRevealMedia from '../AnswerRevealMedia.vue';
import Button from '../Button.vue';

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
    <div v-if="questionPrompt" class="question-prompt rich-text-preview" v-html="questionPrompt" />
    <p class="correct-answer" v-if="correctAnswer">
      Правильный ответ: <strong>{{ correctAnswer }}</strong>
    </p>
    <AnswerRevealMedia :items="answerMedia" />
    <Button v-if="showNextQuestion !== false" class="answer-result-btn" @click="$emit('nextQuestion')">Следующий вопрос</Button>
  </div>
</template>

<style scoped>
.answer-result-card {
  margin-top: 16px;
}

.question-prompt {
  font-size: 16px;
  line-height: 20px;
  padding-top: 16px;
  color: #374151;
}

.correct-answer {
  padding-top: 16px;
}

.answer-result-btn {
  margin-top: 16px;
}
</style>
