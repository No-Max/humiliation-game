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
    <h1 class="page-title page-title--compact">{{ seriesTitle }}</h1>
    <template v-if="linksActive && joined">
      <Button v-if="!isPaused" variant="secondary" @click="$emit('pause')">
        Пауза
      </Button>
      <Button v-else @click="$emit('resume')">
        Продолжить
      </Button>
      <Button variant="secondary" @click="$emit('exit')">
        Выйти
      </Button>
    </template>
    <Button
      v-if="linksActive"
      variant="secondary"
      icon="settings"
      aria-label="Подключение"
      @click="$emit('openConnection')"
    />
  </div>
</template>

<style scoped>
.page-actions .page-title--compact {
  margin: 0;
}

.page-actions {
  display: block;
  margin-bottom: 8px;
  font-size: 0;
}

.page-actions>* {
  display: inline-block;
  vertical-align: middle;
  font-size: 16px;
  margin-left: 8px;
  margin-bottom: 8px;
}

.page-actions> :first-child {
  margin-left: 0;
}

.page-actions .page-title {
  max-width: calc(100% - 280px);
}
</style>
