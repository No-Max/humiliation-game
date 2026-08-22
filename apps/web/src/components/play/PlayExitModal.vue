<script setup lang="ts">
import Button from '../Button.vue';
import ModalShell from '../ModalShell.vue';

defineEmits<{
  close: [];
  confirm: [];
}>();
</script>

<template>
  <ModalShell title-id="exit-title" @close="$emit('close')">
    <template #header>
      <h2 id="exit-title">Выйти из игры?</h2>
      <Button variant="close" aria-label="Закрыть" @click="$emit('close')">
        ×
      </Button>
    </template>
    <p class="exit-message">
      Игра будет поставлена на паузу. Вернитесь по ссылке командного слота, когда будете готовы.
    </p>
    <div class="modal-actions">
      <Button @click="$emit('confirm')">Выйти</Button>
      <Button variant="secondary" @click="$emit('close')">Отмена</Button>
    </div>
  </ModalShell>
</template>

<style scoped>
.exit-message {
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
}

.modal-actions > :deep(*:last-child) {
  margin-right: 0;
}
</style>
