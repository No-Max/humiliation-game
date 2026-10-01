<script setup lang="ts">
import { ref } from 'vue';
import Button from './Button.vue';

defineProps<{
  roomCode: string;
}>();

const copyMessage = ref('');

async function copyRoomCode(code: string) {
  await navigator.clipboard.writeText(code);
  copyMessage.value = 'Код комнаты скопирован';
}
</script>

<template>
  <div class="display-connection-help">
    <p class="display-connection-help-title">Как подключить экран</p>
    <ol class="display-connection-help-list">
      <li>На TV, ноуте или планшете откройте сайт ingame.by</li>
      <li>Нажмите кнопку «Смотреть» в шапке и введите код комнаты.</li>
    </ol>
    <div v-if="roomCode" class="display-connection-code-block">
      <span class="display-connection-code-label">Код комнаты:</span>
      <span class="display-connection-code-value">{{ roomCode }}</span>
      <Button
        variant="secondary"
        icon="copy"
        class="display-connection-code-copy"
        compact
        aria-label="Скопировать код комнаты"
        @click="copyRoomCode(roomCode)"
      />
      <p v-if="copyMessage" class="display-connection-copy-message">{{ copyMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
.display-connection-help {
  margin: 0 0 20px;
}

.display-connection-help-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: bold;
  color: #374151;
}

.display-connection-help-list {
  margin: 0;
  padding-left: 20px;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.45;
}

.display-connection-help-list li + li {
  margin-top: 6px;
}

.display-connection-code-block {
  margin-top: 16px;
  font-size: 0;
}

.display-connection-code-label {
  display: block;
  margin-bottom: 8px;
  font-size: 15px;
  font-weight: bold;
  color: #374151;
}

.display-connection-code-value {
  display: inline-block;
  vertical-align: middle;
  font-size: 32px;
  font-weight: bold;
  letter-spacing: 0.2em;
  font-variant-numeric: tabular-nums;
  color: #1a1a2e;
}

.display-connection-code-copy {
  margin-left: 12px;
  vertical-align: middle;
}

.display-connection-copy-message {
  margin: 8px 0 0;
  font-size: 14px;
  color: #059669;
  font-weight: bold;
}
</style>
