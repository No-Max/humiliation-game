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
  vertical-align: middle;
  width: 360px;
}

.page-actions {
  display: block;
  font-size: 0;
}

.page-action {
  display: inline-block;
  vertical-align: middle;
  margin-left: 8px;
}

.page-actions-inner {
  display: inline-block;
  vertical-align: middle;
  width: calc(100% - 360px);
  text-align: right;
}

@media (max-width: 768px) {
  .page-actions .page-title--compact {
    width: 220px;
  }

  .page-actions-inner {
    width: calc(100% - 220px);
  }
}

@media (max-width: 500px) {
  .page-actions .page-title--compact {
    width: 100%;
    padding-bottom: 8px;
  }

  .page-actions-inner {
    width: 100%;
  }
}
</style>
