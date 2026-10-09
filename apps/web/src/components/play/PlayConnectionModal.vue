<script setup lang="ts">
import type { RoomState } from '@humiliation-game/shared';
import DisplayConnectionHelp from '../DisplayConnectionHelp.vue';
import GameConnectionPanel from '../GameConnectionPanel.vue';
import Button from '../Button.vue';
import ModalShell from '../ModalShell.vue';

defineProps<{
  roomCode: string;
  teamId: string;
  state: RoomState | null;
}>();

const teamName = defineModel<string>('teamName', { required: true });

defineEmits<{
  close: [];
  teamRenamed: [name: string];
  teamLeft: [];
}>();
</script>

<template>
  <ModalShell title-id="connection-title" @close="$emit('close')">
    <template #header>
      <h2 id="connection-title">Подключение</h2>
      <Button variant="close" aria-label="Закрыть" @click="$emit('close')" />
    </template>
    <DisplayConnectionHelp :room-code="roomCode" />
    <div class="connection-modal-divider" />
    <GameConnectionPanel
      :room-code="roomCode"
      :team-id="teamId"
      v-model:team-name="teamName"
      :state="state"
      @team-renamed="$emit('teamRenamed', $event)"
      @team-left="$emit('teamLeft')"
    />
  </ModalShell>
</template>

<style scoped>
.connection-modal-divider {
  margin: 0 0 20px;
  border-top: 1px solid #e5e7eb;
}
</style>
