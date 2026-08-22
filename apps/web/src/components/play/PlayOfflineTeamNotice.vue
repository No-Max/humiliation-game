<script setup lang="ts">
import type { TeamState } from '@humiliation-game/shared';
import Button from '../Button.vue';

defineProps<{
  team: TeamState;
}>();

defineEmits<{
  openConnection: [];
}>();
</script>

<template>
  <div class="card hint" style="margin-top: 16px">
    <strong>{{ team.name }}</strong> offline —
    откройте ссылку командного слота на другом телефоне.
    <Button
      variant="secondary"
      icon
      icon-size="lg"
      aria-label="Подключение"
      style="margin-top: 12px"
      @click="$emit('openConnection')"
    >
      <svg class="connection-settings-icon" role="presentation" aria-hidden="true">
        <use href="/icons.svg#settings-icon"></use>
      </svg>
    </Button>
  </div>
</template>

<style scoped>
.connection-settings-icon {
  width: 20px;
  height: 20px;
}
</style>
