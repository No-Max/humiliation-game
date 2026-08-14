<script setup lang="ts">
defineProps<{
  seriesTitle: string;
  linksActive: boolean;
  joined: boolean;
  isPaused: boolean;
}>();

defineEmits<{
  pause: [];
  resume: [];
  exit: [];
  openConnection: [];
}>();
</script>

<template>
  <div class="page-actions">
    <h1 class="page-title" style="margin: 0; flex: 1">{{ seriesTitle }}</h1>
    <template v-if="linksActive && joined">
      <button
        v-if="!isPaused"
        class="btn btn-secondary"
        type="button"
        @click="$emit('pause')"
      >
        Пауза
      </button>
      <button
        v-else
        class="btn"
        type="button"
        @click="$emit('resume')"
      >
        Продолжить
      </button>
      <button class="btn btn-secondary" type="button" @click="$emit('exit')">
        Выйти
      </button>
    </template>
    <button
      v-if="linksActive"
      class="btn btn-secondary connection-settings-btn"
      type="button"
      aria-label="Подключение"
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
