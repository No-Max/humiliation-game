<script setup lang="ts">
import type { TeamState } from '@humiliation-game/shared';

defineProps<{
  teams: TeamState[];
}>();
</script>

<template>
  <div class="card">
    <div class="banner correct tour-results">
      <p class="tour-results-title">Игра окончена!</p>
      <p v-for="team in teams" :key="team.id" class="tour-results-row">
        {{ team.name }} — {{ team.score }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.tour-results {
  margin: 0;
  display: block;
}

.tour-results > * + * {
  margin-top: 16px;
}

.tour-results-title {
  font-size: 18px;
  margin: 0;
}

.tour-results-row {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}
</style>
