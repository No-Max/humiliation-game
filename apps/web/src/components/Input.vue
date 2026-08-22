<script setup lang="ts">
import { computed, useAttrs } from "vue";

type Variant = "default" | "code" | "copy";

const props = withDefaults(
  defineProps<{
    variant?: Variant;
    highlight?: boolean;
    compact?: boolean;
  }>(),
  {
    variant: "default",
  }
);

const model = defineModel<string>({ default: "" });

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();

const inputClass = computed(() => {
  const classes: (string | Record<string, boolean>)[] = [`input--${props.variant}`];

  if (props.highlight) {
    classes.push("input--highlight");
  }

  if (props.compact) {
    classes.push("input--compact");
  }

  if (typeof attrs.class === "string") {
    classes.push(attrs.class);
  } else if (Array.isArray(attrs.class)) {
    classes.push(...attrs.class);
  } else if (attrs.class && typeof attrs.class === "object") {
    classes.push(attrs.class);
  }

  return classes;
});

const passthroughAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <input
    class="input"
    :class="inputClass"
    v-model="model"
    v-bind="passthroughAttrs"
  />
</template>

<style>
.input {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  margin-bottom: 12px;
  box-sizing: border-box;
  color: inherit;
  outline: none;
}

.input--compact {
  height: 36px;
  font-size: 14px;
}

.card .input {
  margin-bottom: 0;
}

.input--code {
  height: auto;
  min-height: 44px;
  padding: 10px 12px;
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 0.2em;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.input--copy {
  height: 36px;
  font-size: 14px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0 40px 0 12px;
  color: #374151;
  margin-bottom: 0;
}

.input--copy:focus {
  border-color: #a5b4fc;
  box-shadow: 0 0 0 2px rgb(79 70 229 / 15%);
}

.input--copy.input--highlight {
  color: #4f46e5;
}
</style>
