<script setup lang="ts">
import AdminIcon from './AdminIcon.vue';

defineProps<{
  open: boolean;
  title: string;
  submitLabel?: string;
  deleteLabel?: string;
  loading?: boolean;
  hideSubmit?: boolean;
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
      <div class="modal" role="dialog" :aria-labelledby="title">
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
