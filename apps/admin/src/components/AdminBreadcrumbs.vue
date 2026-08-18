<script setup lang="ts">
import { RouterLink } from 'vue-router';
import type { BreadcrumbItem } from '../lib/adminBreadcrumbs';

defineProps<{
  items: BreadcrumbItem[];
}>();
</script>

<template>
  <nav v-if="items.length > 1" class="breadcrumbs" aria-label="Навигация">
    <ol class="breadcrumbs-list">
      <li v-for="(item, index) in items" :key="`${item.label}-${index}`" class="breadcrumbs-item">
        <RouterLink
          v-if="item.to && index < items.length - 1"
          :to="item.to"
          class="breadcrumbs-link"
        >
          {{ item.label }}
        </RouterLink>
        <span v-else class="breadcrumbs-current" aria-current="page">{{ item.label }}</span>
        <span v-if="index < items.length - 1" class="breadcrumbs-sep" aria-hidden="true">/</span>
      </li>
    </ol>
  </nav>
</template>
