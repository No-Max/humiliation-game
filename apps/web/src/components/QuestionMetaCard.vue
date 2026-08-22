<script setup lang="ts">
import { formatPoints, type RoomState } from '@humiliation-game/shared';

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
      Ваш ход · {{ formatPoints(state.questionValue) }}
    </p>
    <p v-else class="question-meta-details">
      {{ formatPoints(state.questionValue) }}
    </p>

    <div v-if="state.turnNotice" class="banner warning turn-notice">
      {{ state.turnNotice }}
    </div>
  </div>
</template>

<style scoped>
.question-meta-card {
  text-align: center;
}

.question-meta-card > * + * {
  margin-top: 16px;
}

.question-meta-details {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.question-meta-turn {
  margin: 0;
}

.question-meta-turn-own {
  font-weight: 600;
}

.turn-notice {
  margin-top: 16px;
  text-align: center;
  font-weight: 600;
}
</style>
