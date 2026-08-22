<script setup lang="ts">
defineProps<{
  titleId?: string;
}>();

defineEmits<{ close: [] }>();
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal" role="dialog" :aria-labelledby="titleId">
      <div v-if="$slots.header" class="modal-header">
        <slot name="header" />
      </div>
      <div class="modal-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 45%);
  padding: 16px;
  z-index: 1000;
  text-align: center;
  font-size: 0;
  white-space: nowrap;
  overflow: auto;
}

.modal-overlay::before {
  content: '';
  display: inline-block;
  height: 100%;
  vertical-align: middle;
}

.modal {
  display: inline-block;
  vertical-align: middle;
  white-space: normal;
  text-align: left;
  font-size: 16px;
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgb(0 0 0 / 15%);
}

.modal-header {
  display: block;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header::after {
  content: '';
  display: table;
  clear: both;
}

.modal-header :deep(h2) {
  display: inline-block;
  vertical-align: middle;
  font-size: 20px;
  max-width: calc(100% - 40px);
  margin: 0;
}

.modal-body {
  padding: 20px;
}
</style>
