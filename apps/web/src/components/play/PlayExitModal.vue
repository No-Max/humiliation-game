<script setup lang="ts">
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
        <button class="modal-close" type="button" aria-label="Закрыть" @click="$emit('close')">
          ×
        </button>
      </div>
      <div class="modal-body">
        <p style="margin-bottom: 16px">
          Игра будет поставлена на паузу. Вернитесь по ссылке командного слота, когда будете готовы.
        </p>
        <div class="modal-actions">
          <button class="btn" @click="$emit('confirm')">Выйти</button>
          <button class="btn btn-secondary" @click="$emit('close')">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>
