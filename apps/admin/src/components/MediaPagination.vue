<script setup lang="ts">
defineProps<{
  page: number;
  totalPages: number;
  total: number;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  prev: [];
  next: [];
}>();
</script>

<template>
  <div v-if="totalPages > 1" class="media-pagination">
    <button
      class="btn btn-secondary btn-sm"
      type="button"
      :disabled="disabled || page <= 1"
      @click="emit('prev')"
    >
      ← Назад
    </button>
    <span class="media-pagination-meta">
      Страница {{ page }} из {{ totalPages }} · {{ total }} файлов
    </span>
    <button
      class="btn btn-secondary btn-sm"
      type="button"
      :disabled="disabled || page >= totalPages"
      @click="emit('next')"
    >
      Вперёд →
    </button>
  </div>
</template>

<style scoped>
.media-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.media-pagination-meta {
  color: #6b7280;
  font-size: 0.875rem;
}
</style>
