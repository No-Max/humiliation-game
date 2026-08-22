<script setup lang="ts">
import Button from '../Button.vue';

defineProps<{
  code: string;
  isPaused: boolean;
  pausedBy?: string;
  socketConnected: boolean;
  status?: string;
  teamId: string;
  joined: boolean;
  linksActive: boolean;
}>();

defineEmits<{
  reconnect: [];
}>();
</script>

<template>
  <div v-if="isPaused" class="pause-banner">
    ⏸ Игра на паузе
    <span v-if="pausedBy"> ({{ pausedBy }})</span>
    — нажмите «Продолжить», когда будете готовы
  </div>

  <div v-if="!socketConnected" class="card banner wrong">
    Связь потеряна… Переподключаемся
  </div>

  <div v-if="status === 'FINISHED'" class="card banner wrong">
    Игра завершена — ссылки больше не активны
  </div>

  <div v-else-if="!teamId" class="card">
    <p>Командный слот не выбран.</p>
    <Button :to="`/join/${code}`">Подключиться к комнате</Button>
  </div>

  <div v-else-if="!joined && teamId && linksActive" class="card">
    <p>Не удалось занять командный слот.</p>
    <Button @click="$emit('reconnect')">Подключиться снова</Button>
  </div>
</template>

<style scoped>
.pause-banner {
  background: #fef3c7;
  color: #92400e;
  text-align: center;
  padding: 8px;
  border-radius: 8px;
  font-weight: bold;
  margin-bottom: 8px;
}
</style>
