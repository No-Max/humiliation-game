<script setup lang="ts">
import { ref } from 'vue';
import type { AnswerMediaItem, TeamState } from '@humiliation-game/shared';
import AnswerRevealMedia from '../AnswerRevealMedia.vue';
import Button from '../Button.vue';
import PlayAdjustResultModal from './PlayAdjustResultModal.vue';

defineProps<{
  phase: 'CORRECT' | 'REVEAL';
  questionValue: number;
  questionPrompt?: string;
  correctAnswer?: string;
  answerMedia?: AnswerMediaItem[];
  teams: TeamState[];
  scoringTeamId?: string;
  showNextQuestion?: boolean;
}>();

const emit = defineEmits<{
  nextQuestion: [];
  adjustResult: [scoringTeamId: string | null];
}>();

const showAdjustModal = ref(false);

function openAdjustModal() {
  showAdjustModal.value = true;
}

function closeAdjustModal() {
  showAdjustModal.value = false;
}

function saveAdjustResult(scoringTeamId: string | null) {
  emit('adjustResult', scoringTeamId);
  showAdjustModal.value = false;
}
</script>

<template>
  <div class="card answer-result-card">
    <div v-if="phase === 'CORRECT'" class="banner correct">
      Верно!
    </div>
    <div v-else class="banner wrong">Никто не угадал</div>
    <div v-if="questionPrompt" class="question-prompt rich-text-preview" v-html="questionPrompt" />
    <p v-if="correctAnswer" class="correct-answer">
      Правильный ответ: <strong>{{ correctAnswer }}</strong>
    </p>
    <AnswerRevealMedia :items="answerMedia" />

    <div class="answer-result-actions">
      <Button
        v-if="showNextQuestion !== false"
        class="answer-result-btn"
        @click="emit('nextQuestion')"
      >
        Следующий вопрос
      </Button>
      <Button
        class="answer-result-btn"
        variant="secondary"
        @click="openAdjustModal"
      >
        Изменить
      </Button>
    </div>

    <PlayAdjustResultModal
      :open="showAdjustModal"
      :teams="teams"
      :question-value="questionValue"
      :scoring-team-id="scoringTeamId"
      @close="closeAdjustModal"
      @save="saveAdjustResult"
    />
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

.answer-result-actions {
  display: block;
  font-size: 0;
  margin-top: 16px;
}

.answer-result-actions > :deep(*) {
  display: inline-block;
  vertical-align: middle;
  font-size: 16px;
  margin-right: 8px;
}

.answer-result-actions > :deep(*:last-child) {
  margin-right: 0;
}
</style>
