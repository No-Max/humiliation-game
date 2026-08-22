<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { RouterLink } from "vue-router";

type Variant = "primary" | "secondary" | "close" | "ghost" | "choice";

const props = withDefaults(
  defineProps<{
    variant?: Variant;
    to?: string | Record<string, unknown>;
    href?: string;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    selected?: boolean;
    block?: boolean;
    icon?: boolean;
    iconSize?: "sm" | "md" | "lg";
    large?: boolean;
  }>(),
  {
    variant: "primary",
    type: "button",
    iconSize: "sm",
  }
);

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();

const component = computed(() => {
  if (props.to) return RouterLink;
  if (props.href) return "a";
  return "button";
});

const buttonClass = computed(() => {
  const classes: (string | Record<string, boolean>)[] = [`btn--${props.variant}`];

  if (props.icon) {
    classes.push("btn--icon", `btn--icon-${props.iconSize}`);
  }

  if (props.selected) {
    classes.push("btn--selected");
  }

  if (props.block) {
    classes.push("btn--block");
  }

  if (props.large) {
    classes.push("btn--large");
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
  <component
    :is="component"
    class="btn"
    :class="buttonClass"
    :type="component === 'button' ? type : undefined"
    :to="to"
    :href="href"
    :disabled="disabled"
    v-bind="passthroughAttrs"
  >
    <slot />
  </component>
</template>

<style>
.btn {
  display: inline-block;
  vertical-align: middle;
  text-align: center;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  background: #4f46e5;
  color: #fff;
  font-size: 16px;
  line-height: 20px;
  font-family: inherit;
  cursor: pointer;
  text-decoration: none;
  box-sizing: border-box;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--secondary {
  background: #e5e7eb;
  color: #1a1a2e;
}

.btn--close {
  float: right;
  background: none;
  font-size: 24px;
  line-height: 1;
  color: #6b7280;
  padding: 4px;
}

.btn--ghost {
  background: transparent;
  color: #6b7280;
  padding: 0;
}

.btn--ghost:not(:disabled):hover {
  background: #f3f4f6;
  color: #4f46e5;
}

.btn--icon {
  padding: 0;
}

.btn--icon-sm {
  width: 32px;
  height: 32px;
  line-height: 32px;
  border-radius: 4px;
}

.btn--icon-md {
  width: 38px;
  height: 38px;
  line-height: 38px;
  border-radius: 6px;
}

.btn--icon-lg {
  width: 40px;
  height: 40px;
  line-height: 40px;
}

.btn--ghost.btn--icon-sm:not(:disabled):hover {
  background: #e5e7eb;
  color: #374151;
}

.btn--ghost.btn--icon-sm:not(:disabled):active {
  background: #d1d5db;
}

.btn--block {
  width: 100%;
}

.btn--choice {
  width: 100%;
  min-width: 0;
  display: block;
  text-align: left;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 16px;
  line-height: 1.35;
  border: 2px solid #e5e7eb;
  background: #fff;
  color: inherit;
  transition: border-color 0.15s, background 0.15s;
}

.btn--choice:not(:disabled):hover {
  border-color: #c7d2fe;
  background: #eef2ff;
}

.btn--choice.btn--selected {
  border-color: #4f46e5;
  background: #eef2ff;
}

.btn--choice.btn--large {
  padding: 16px 20px;
  font-size: 20px;
}
</style>
