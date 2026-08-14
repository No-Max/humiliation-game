<script setup lang="ts">
import type { TeamState } from '@humiliation-game/shared';

defineProps<{
  teams: TeamState[];
  activeTeamId?: string;
}>();
</script>

<template>
  <div class="scoreboard">
    <div
      v-for="team in teams"
      :key="team.id"
      class="team-score"
      :class="{ active: team.id === activeTeamId }"
    >
      <div>{{ team.name }}</div>
      <small v-if="!team.connected" style="color: #ef4444; display: block">offline</small>
      <small v-if="team.passed" style="color: #9ca3af; display: block">сдалась</small>
    </div>
  </div>
</template>
