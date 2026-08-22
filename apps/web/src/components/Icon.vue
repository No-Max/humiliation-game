<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    name: string;
    size?: number;
  }>(),
  {
    size: 20,
  },
);

const href = computed(() => {
  const id = props.name.endsWith('-icon') ? props.name : `${props.name}-icon`;
  return `/icons.svg#${id}`;
});
</script>

<template>
  <svg
    class="icon"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="presentation"
    aria-hidden="true"
  >
    <use :href="href" />
  </svg>
</template>

<style scoped>
.icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
