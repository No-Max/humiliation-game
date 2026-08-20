<script setup lang="ts">
import AdminIcon from './AdminIcon.vue';

const model = defineModel<string>({ default: '' });

withDefaults(
  defineProps<{
    bottomGap?: boolean;
  }>(),
  {
    bottomGap: false,
  },
);
</script>

<template>
  <label
    class="media-search"
    :class="{ 'media-search-spaced': bottomGap }"
  >
    <AdminIcon name="search-icon" class="media-search-icon" />
    <input
      v-model="model"
      class="input media-search-input"
      type="search"
      placeholder="Поиск по названию файла"
      autocomplete="off"
    />
  </label>
</template>

<style scoped>
.media-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 320px;
}

.media-search-spaced {
  margin-bottom: 1rem;
}

.media-search-icon {
  width: 1.125rem;
  height: 1.125rem;
  color: #6b7280;
  flex-shrink: 0;
}

.media-search-input {
  margin-bottom: 0;
  flex: 1;
  min-width: 0;
}
</style>
