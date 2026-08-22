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
      icon
      icon-size="lg"
      class="connection-btn"
      aria-label="Подключение"
      @click="$emit('openConnection')"
    >
      <svg class="connection-settings-icon" role="presentation" aria-hidden="true">
        <use href="/icons.svg#settings-icon"></use>
      </svg>
    </Button>
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

.connection-settings-icon {
  width: 20px;
  height: 20px;
}
</style>
