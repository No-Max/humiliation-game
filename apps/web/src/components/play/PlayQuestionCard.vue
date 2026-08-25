<script setup lang="ts">
import type { RoomState, TeamState } from '@humiliation-game/shared';
import QuestionChoices from '../QuestionChoices.vue';
import QuestionContent from '../QuestionContent.vue';
import QuestionHints from '../QuestionHints.vue';
import Button from '../Button.vue';
import Input from '../Input.vue';

defineProps<{
  state: RoomState;
  isPaused: boolean;
  isMyTurn: boolean;
  myTeam?: TeamState;
  isChoiceQuestion: boolean;
  canSubmit: boolean;
}>();

const answer = defineModel<string>('answer', { required: true });

defineEmits<{
  submitChoice: [choice: string];
  submit: [];
  pass: [];
}>();
</script>

<template>
  <div class="card">
    <QuestionContent :prompt="state.questionPrompt" :media-urls="state.mediaUrls" class="question-content"/>
    <QuestionHints :hints="state.hints" :hints-total="state.hintsTotal" />

    <template v-if="isMyTurn && myTeam?.connected !== false">
      <template v-if="isChoiceQuestion && state.choices?.length">
        <QuestionChoices :choices="state.choices" :selected="answer" @select="$emit('submitChoice', $event)" />
        <Button class="question-card-btn" variant="secondary" @click="$emit('pass')">
          Сдаёмся
        </Button>
      </template>

      <template v-else>
        <Input v-model="answer" placeholder="Ваш ответ" @keyup.enter="$emit('submit')" />
        <div class="card-actions">
          <Button :disabled="!canSubmit" @click="$emit('submit')">
            Ответить
          </Button>
          <Button class="question-card-btn" variant="secondary" @click="$emit('pass')">
            Сдаёмся
          </Button>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.card-actions {
  display: block;
  font-size: 0;
}

.question-content {
  margin-top: -16px;
}

.card-actions> :deep(*) {
  display: inline-block;
  vertical-align: middle;
  font-size: 16px;
  margin-right: 16px;
  margin-top: 16px;
}

.card-actions> :deep(*:last-child) {
  margin-right: 0;
}

.question-card-btn {
  margin-top: 16px;
}
</style>
