<script setup lang="ts">
import { RouterLink } from 'vue-router';

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
    <RouterLink :to="`/join/${code}`" class="btn">Подключиться к комнате</RouterLink>
  </div>

  <div v-else-if="!joined && teamId && linksActive" class="card">
    <p>Не удалось занять командный слот.</p>
    <button class="btn" @click="$emit('reconnect')">Подключиться снова</button>
  </div>
</template>
