<script setup lang="ts">
import type { TeamState } from '@humiliation-game/shared';

defineProps<{
  teams: TeamState[];
}>();
</script>

<template>
  <div class="card game-over-card">
    <div class="banner correct tour-results">
      <p class="tour-results-title">Игра окончена!</p>
      <p v-for="team in teams" :key="team.id" class="tour-results-row">
        {{ team.name }} — {{ team.score }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.game-over-card {
  margin-top: 16px;
}
</style>