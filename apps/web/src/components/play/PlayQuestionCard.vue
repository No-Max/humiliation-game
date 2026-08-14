<script setup lang="ts">
import type { RoomState, TeamState } from '@humiliation-game/shared';
import QuestionChoices from '../QuestionChoices.vue';
import QuestionContent from '../QuestionContent.vue';

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
    <div v-if="state.hints?.length" class="hints-list">
      <p v-if="state.hintsTotal" class="hints-caption">
        Подсказки {{ state.hints.length }} из {{ state.hintsTotal }}
      </p>
      <p
        v-for="(hint, index) in state.hints"
        :key="`${index}-${hint}`"
        class="hint"
        :class="{ 'hint-latest': index === state.hints.length - 1 }"
      >
        💡 {{ index + 1 }}. {{ hint }}
      </p>
    </div>

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
