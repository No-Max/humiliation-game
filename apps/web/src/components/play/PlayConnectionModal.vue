<script setup lang="ts">
import type { RoomState } from '@humiliation-game/shared';
import GameConnectionPanel from '../GameConnectionPanel.vue';
import Button from '../Button.vue';

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
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal" role="dialog" aria-labelledby="connection-title">
      <div class="modal-header">
        <h2 id="connection-title">Подключение</h2>
        <Button variant="close" aria-label="Закрыть" @click="$emit('close')">
          ×
        </Button>
      </div>
      <div class="modal-body">
        <GameConnectionPanel
          :room-code="roomCode"
          :team-id="teamId"
          v-model:team-name="teamName"
          :state="state"
          intro-text="Ссылки активны до конца игры"
          @team-renamed="$emit('teamRenamed', $event)"
        />
      </div>
    </div>
  </div>
</template>
