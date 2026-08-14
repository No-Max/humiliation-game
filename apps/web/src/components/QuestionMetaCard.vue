<script setup lang="ts">
import type { RoomState } from '@humiliation-game/shared';

defineProps<{
  state: RoomState;
  isMyTurn?: boolean;
  myTeamConnected?: boolean;
}>();
</script>

<template>
  <div class="card question-meta-card">
    <p
      v-if="isMyTurn !== undefined && isMyTurn && myTeamConnected !== false"
      class="question-meta-turn question-meta-turn-own"
    >
      Ваш ход · {{ state.questionValue }} балл(ов)
    </p>
    <p v-else class="question-meta-details">
      {{ state.questionValue }} б.
    </p>

    <div v-if="state.turnNotice" class="banner wrong turn-notice">
      {{ state.turnNotice }}
    </div>
  </div>
</template>

<style scoped>
.question-meta-card {
  text-align: center;
}

.question-meta-details {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.question-meta-turn {
  margin: 0;
}

.question-meta-turn-own {
  font-weight: 600;
}
</style>
