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
  <div class="card hint" style="margin-top: 16px">
    <strong>{{ team.name }}</strong> offline —
    откройте ссылку командного слота на другом телефоне.
    <button
      class="btn btn-secondary connection-settings-btn"
      type="button"
      aria-label="Подключение"
      style="margin-top: 12px"
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
  display: inline-block;
  vertical-align: middle;
  text-align: center;
  line-height: 40px;
  width: 40px;
  height: 40px;
  padding: 0;
}

.connection-settings-icon {
  width: 20px;
  height: 20px;
}
</style>
