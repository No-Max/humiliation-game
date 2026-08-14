<script setup lang="ts">
import type { TeamState } from '@humiliation-game/shared';

defineProps<{
  team: TeamState;
}>();

defineEmits<{
  openConnection: [];
}>();
</script>

<template>
  <div class="card hint" style="margin-top: 1rem">
    <strong>{{ team.name }}</strong> offline —
    откройте ссылку командного слота на другом телефоне.
    <button
      class="btn btn-secondary connection-settings-btn"
      type="button"
      aria-label="Подключение"
      style="margin-top: 0.75rem"
      @click="$emit('openConnection')"
    >
      <svg class="connection-settings-icon" role="presentation" aria-hidden="true">
        <use href="/icons.svg#settings-icon"></use>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.connection-settings-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
}

.connection-settings-icon {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
