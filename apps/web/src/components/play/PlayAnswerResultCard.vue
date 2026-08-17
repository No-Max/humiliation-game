<script setup lang="ts">
import type { AnswerMediaItem } from '@humiliation-game/shared';
import AnswerRevealMedia from '../AnswerRevealMedia.vue';

defineProps<{
  phase: 'CORRECT' | 'REVEAL';
  questionValue: number;
  correctAnswer?: string;
  answerMedia?: AnswerMediaItem[];
}>();

defineEmits<{
  nextQuestion: [];
}>();
</script>

<template>
  <div class="card">
    <div v-if="phase === 'CORRECT'" class="banner correct">
      Верно! +{{ questionValue }}
    </div>
    <div v-else class="banner wrong">Никто не угадал</div>
    <p v-if="correctAnswer">
      Правильный ответ: <strong>{{ correctAnswer }}</strong>
    </p>
    <AnswerRevealMedia :items="answerMedia" />
    <button class="btn" type="button" @click="$emit('nextQuestion')">Следующий вопрос</button>
  </div>
</template>
