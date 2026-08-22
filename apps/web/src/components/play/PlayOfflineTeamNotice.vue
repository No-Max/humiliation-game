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
  <div class="card offline-notice">
    <strong>{{ team.name }}</strong> offline —
    откройте ссылку командного слота на другом телефоне.
    <Button
      variant="secondary"
      icon="settings"
      class="connection-btn"
      aria-label="Подключение"
      @click="$emit('openConnection')"
    />
  </div>
</template>

<style scoped>
.offline-notice {
  background: #fef3c7;
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0 0;
}

.connection-btn {
  margin-top: 12px;
}
</style>
