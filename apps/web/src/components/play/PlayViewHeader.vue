<script setup lang="ts">
import Button from '../Button.vue';

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
    <h1 class="page-title" style="margin: 0">{{ seriesTitle }}</h1>
    <template v-if="linksActive && joined">
      <Button
        v-if="!isPaused"
        variant="secondary"
        @click="$emit('pause')"
      >
        Пауза
      </Button>
      <Button
        v-else
        @click="$emit('resume')"
      >
        Продолжить
      </Button>
      <Button variant="secondary" @click="$emit('exit')">
        Выйти
      </Button>
    </template>
    <Button
      v-if="linksActive"
      variant="secondary"
      icon
      icon-size="lg"
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
.connection-settings-icon {
  width: 20px;
  height: 20px;
}
</style>
