<script setup lang="ts">
import { computed } from 'vue';
import type { RoomState, TeamState } from '@humiliation-game/shared';
import QuestionChoices from '../QuestionChoices.vue';
import QuestionContent from '../QuestionContent.vue';
import QuestionHints from '../QuestionHints.vue';
import Button from '../Button.vue';
import Input from '../Input.vue';

const props = defineProps<{
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
  skipTurn: [];
}>();

const canPass = computed(() => {
  const total = props.state.hintsTotal ?? 0;
  const revealed = props.state.hints?.length ?? 0;
  return total === 0 || revealed >= total;
});

const canSkip = computed(() => {
  if (!props.isMyTurn || props.myTeam?.connected === false) return false;
  if (props.myTeam?.passed) return false;
  return props.state.teams.filter((team) => !team.passed).length > 1;
});

const showTurnActions = computed(
  () => props.isMyTurn && props.myTeam?.connected !== false,
);
</script>

<template>
  <div class="card">
    <QuestionContent :prompt="state.questionPrompt" :media-urls="state.mediaUrls" :audio-url="state.audioUrl"
      class="question-content" />
    <QuestionHints :hints="state.hints" :hints-total="state.hintsTotal" />

    <template v-if="isChoiceQuestion && state.choices?.length">
      <QuestionChoices :choices="state.choices" :selected="answer" :disabled="!isMyTurn || myTeam?.connected === false"
        @select="$emit('submitChoice', $event)" />
      <div v-if="showTurnActions && (canSkip || canPass)" class="card-actions">
        <Button v-if="canSkip" class="question-card-btn" variant="secondary" @click="$emit('skipTurn')">
          Пропустить
        </Button>
        <Button v-if="canPass" class="question-card-btn" variant="secondary" @click="$emit('pass')">
          Сдаёмся
        </Button>
      </div>
    </template>

    <template v-else-if="showTurnActions">
      <Input v-model="answer" placeholder="Ваш ответ" @keyup.enter="$emit('submit')" />
      <div class="card-actions">
        <Button :disabled="!canSubmit" @click="$emit('submit')">
          Ответить
        </Button>
        <Button v-if="canSkip" class="question-card-btn" variant="secondary" @click="$emit('skipTurn')">
          Пропустить
        </Button>
        <Button v-if="canPass" class="question-card-btn" variant="secondary" @click="$emit('pass')">
          Сдаёмся
        </Button>
      </div>
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
