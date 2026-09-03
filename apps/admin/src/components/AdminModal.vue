<script setup lang="ts">
import AdminIcon from './AdminIcon.vue';

defineProps<{
  open: boolean;
  title: string;
  submitLabel?: string;
  deleteLabel?: string;
  loading?: boolean;
  hideSubmit?: boolean;
  maxWidth?: string;
}>();

const emit = defineEmits<{
  close: [];
  submit: [];
  delete: [];
}>();
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="emit('close')">
      <div
        class="modal"
        role="dialog"
        :aria-labelledby="title"
        :style="maxWidth ? { maxWidth, width: `min(${maxWidth}, 100%)` } : undefined"
      >
        <div class="modal-header">
          <h2 :id="title">{{ title }}</h2>
          <button class="modal-close" type="button" aria-label="Закрыть" @click="emit('close')">
            <AdminIcon name="close-icon" />
          </button>
        </div>
        <form class="modal-body" @submit.prevent="emit('submit')">
          <slot />
          <div class="modal-actions">
            <button
              v-if="deleteLabel"
              class="btn btn-danger modal-delete"
              type="button"
              :disabled="loading"
              @click="emit('delete')"
            >
              <AdminIcon name="trash-icon" />
              {{ deleteLabel }}
            </button>
            <div v-if="$slots['actions-start']" class="modal-actions-start">
              <slot name="actions-start" />
            </div>
            <div class="modal-actions-main">
              <button class="btn btn-secondary" type="button" :disabled="loading" @click="emit('close')">
                <AdminIcon name="close-icon" />
                Отмена
              </button>
              <button v-if="!hideSubmit" class="btn" type="submit" :disabled="loading">
                <AdminIcon :name="(submitLabel ?? 'Сохранить') === 'Создать' ? 'plus-icon' : 'check-icon'" />
                {{ loading ? 'Сохранение...' : (submitLabel ?? 'Сохранить') }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 45%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgb(0 0 0 / 15%);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.25rem;
}

.modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
}

.modal-close :deep(.icon) {
  width: 1.25rem;
  height: 1.25rem;
}

.modal-close:hover {
  color: #111827;
}

.modal-body {
  padding: 1.25rem;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
}

.modal-actions-main {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

.modal-actions-start {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.modal-delete {
  margin-right: auto;
}
</style>
