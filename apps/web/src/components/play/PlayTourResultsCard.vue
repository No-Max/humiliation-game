<script setup lang="ts">
import type { TeamState } from '@humiliation-game/shared';
import Button from '../Button.vue';

defineProps<{
  teams: TeamState[];
}>();

defineEmits<{
  continueToTourIntro: [];
}>();
</script>

<template>
  <div class="card">
    <div class="banner correct tour-results">
      <p class="tour-results-title">Итоги тура</p>
      <p v-for="team in teams" :key="team.id" class="tour-results-row">
        {{ team.name }} — {{ team.score }}
      </p>
    </div>
    <Button @click="$emit('continueToTourIntro')">Далее</Button>
  </div>
</template>
