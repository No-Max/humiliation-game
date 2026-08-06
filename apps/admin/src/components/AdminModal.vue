<script setup lang="ts">
defineProps<{
  open: boolean;
  title: string;
  submitLabel?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [];
}>();
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="emit('close')">
      <div class="modal" role="dialog" :aria-labelledby="title">
        <div class="modal-header">
          <h2 :id="title">{{ title }}</h2>
          <button class="modal-close" type="button" aria-label="Закрыть" @click="emit('close')">
            ×
          </button>
        </div>
        <form class="modal-body" @submit.prevent="emit('submit')">
          <slot />
          <div class="modal-actions">
            <button class="btn btn-secondary" type="button" :disabled="loading" @click="emit('close')">
              Отмена
            </button>
            <button class="btn" type="submit" :disabled="loading">
              {{ loading ? 'Сохранение...' : (submitLabel ?? 'Сохранить') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
