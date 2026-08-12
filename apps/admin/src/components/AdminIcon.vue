<script setup lang="ts">
defineProps<{
  name: string;
}>();
</script>

<template>
  <svg class="icon" role="presentation" aria-hidden="true">
    <use :href="`/icons.svg#${name}`" />
  </svg>
</template>
