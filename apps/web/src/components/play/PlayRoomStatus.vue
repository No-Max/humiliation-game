<script setup lang="ts">
import Button from '../Button.vue';
import Icon from '../Icon.vue';

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
  <div v-if="isPaused" class="banner warning pause-banner">
    <Icon name="pause" :size="18" />
    Игра на паузе
    <span v-if="pausedBy"> ({{ pausedBy }})</span>
    — нажмите «Продолжить», когда будете готовы
  </div>

  <div v-if="!socketConnected" class="card banner wrong">
    Связь потеряна… Переподключаемся
  </div>

  <div v-if="status === 'FINISHED'" class="card banner correct finished-banner">
    Игра завершена
  </div>

  <div v-else-if="!teamId" class="card">
    <p>Командный слот не выбран.</p>
    <Button :to="`/join/${code}`">Подключиться к комнате</Button>
  </div>

  <div v-else-if="!joined && teamId && linksActive" class="card">
    <p>Не удалось занять командный слот.</p>
    <Button class="room-status-btn" @click="$emit('reconnect')">Подключиться снова</Button>
  </div>
</template>

<style scoped>
.card{
  margin-top: 16px;
}

.room-status-btn {
  margin-top: 16px;
}
</style>
