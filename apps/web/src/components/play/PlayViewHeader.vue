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
    <div class="page-actions-inner">
      <template v-if="linksActive && joined">
        <Button class="page-action" v-if="!isPaused" variant="secondary" @click="$emit('pause')">
          Пауза
        </Button>
        <Button class="page-action" v-else @click="$emit('resume')">
          Продолжить
        </Button>
        <Button class="page-action" variant="secondary" @click="$emit('exit')">
          Выйти
        </Button>
      </template>
      <Button class="page-action" v-if="linksActive" variant="secondary" icon="settings" aria-label="Подключение"
        @click="$emit('openConnection')" />
    </div>
  </div>
</template>

<style scoped>
.page-actions .page-title--compact {
  margin: 0;
  display: inline-block;
}

.page-actions {
  display: block;
  margin-bottom: 8px;
  font-size: 0;
}

.page-action {
  display: inline-block;
  vertical-align: middle;
  margin-left: 8px;
  margin-bottom: 8px;
}

.page-actions> :first-child {
  margin-left: 0;
}

.page-actions .page-title {
  max-width: calc(100% - 280px);
}

.page-actions-inner {
  float: right;
}
</style>
