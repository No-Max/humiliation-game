<script setup lang="ts">
import type { RoomState } from '@humiliation-game/shared';
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
}>();
</script>

<template>
  <ModalShell title-id="connection-title" @close="$emit('close')">
    <template #header>
      <h2 id="connection-title">Подключение</h2>
      <Button variant="close" aria-label="Закрыть" @click="$emit('close')">
        ×
      </Button>
    </template>
    <GameConnectionPanel
      :room-code="roomCode"
      :team-id="teamId"
      v-model:team-name="teamName"
      :state="state"
      intro-text="Ссылки активны до конца игры"
      @team-renamed="$emit('teamRenamed', $event)"
    />
  </ModalShell>
</template>
