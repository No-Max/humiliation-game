<script setup lang="ts">
import Button from './Button.vue';
import ModalShell from './ModalShell.vue';

defineProps<{
  seriesTitle: string;
}>();

defineEmits<{
  close: [];
  continue: [];
  startNew: [];
}>();
</script>

<template>
  <ModalShell title-id="resume-series-title" @close="$emit('close')">
    <template #header>
      <h2 id="resume-series-title">Продолжить игру?</h2>
      <Button variant="close" aria-label="Закрыть" @click="$emit('close')" />
    </template>
    <p class="resume-message">
      Вы уже играли в «{{ seriesTitle }}», хотите продолжить или удалить прогресс и начать новую?
    </p>
    <div class="modal-actions">
      <Button variant="secondary" @click="$emit('startNew')">Новая игра</Button>
      <Button @click="$emit('continue')">Продолжить</Button>
    </div>
  </ModalShell>
</template>

<style scoped>
.resume-message {
  margin-bottom: 16px;
}

.modal-actions {
  display: block;
  font-size: 0;
}

.modal-actions > :deep(*) {
  display: inline-block;
  vertical-align: middle;
  font-size: 16px;
  margin-right: 8px;
  margin-bottom: 8px;
}

.modal-actions > :deep(*:last-child) {
  margin-right: 0;
}
</style>
