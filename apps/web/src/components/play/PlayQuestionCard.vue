<script setup lang="ts">
import type { RoomState, TeamState } from '@humiliation-game/shared';
import QuestionChoices from '../QuestionChoices.vue';
import QuestionContent from '../QuestionContent.vue';
import QuestionHints from '../QuestionHints.vue';

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
    <QuestionContent :prompt="state.questionPrompt" :media-urls="state.mediaUrls" />
    <QuestionHints :hints="state.hints" :hints-total="state.hintsTotal" />

    <template v-if="isMyTurn && myTeam?.connected !== false">
      <template v-if="isChoiceQuestion && state.choices?.length">
        <QuestionChoices
          :choices="state.choices"
          :selected="answer"
          @select="$emit('submitChoice', $event)"
        />
        <button class="btn btn-secondary" type="button" @click="$emit('pass')">
          Сдаёмся
        </button>
      </template>

      <template v-else>
        <input
          v-model="answer"
          class="input"
          placeholder="Ваш ответ"
          @keyup.enter="$emit('submit')"
        />
        <div class="card-actions">
          <button class="btn" type="button" :disabled="!canSubmit" @click="$emit('submit')">
            Ответить
          </button>
          <button class="btn btn-secondary" type="button" @click="$emit('pass')">
            Сдаёмся
          </button>
        </div>
      </template>
    </template>
  </div>
</template>
