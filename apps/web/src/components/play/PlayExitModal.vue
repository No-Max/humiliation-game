<script setup lang="ts">
import Button from '../Button.vue';

defineEmits<{
  close: [];
  confirm: [];
}>();
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal" role="dialog" aria-labelledby="exit-title">
      <div class="modal-header">
        <h2 id="exit-title">Выйти из игры?</h2>
        <Button variant="close" aria-label="Закрыть" @click="$emit('close')">
          ×
        </Button>
      </div>
      <div class="modal-body">
        <p style="margin-bottom: 16px">
          Игра будет поставлена на паузу. Вернитесь по ссылке командного слота, когда будете готовы.
        </p>
        <div class="modal-actions">
          <Button @click="$emit('confirm')">Выйти</Button>
          <Button variant="secondary" @click="$emit('close')">Отмена</Button>
        </div>
      </div>
    </div>
  </div>
</template>
