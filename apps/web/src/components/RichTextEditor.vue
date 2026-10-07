<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { onBeforeUnmount, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    inputId?: string;
  }>(),
  {
    modelValue: '',
    placeholder: '',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
  ],
  editorProps: {
    attributes: {
      ...(props.inputId ? { id: props.inputId } : {}),
      class: 'rich-text-editor__content',
    },
  },
  onUpdate({ editor: ed }) {
    emit('update:modelValue', ed.getHTML());
  },
});

watch(
  () => props.modelValue,
  (value) => {
    const ed = editor.value;
    if (!ed || ed.getHTML() === value) return;
    ed.commands.setContent(value || '', { emitUpdate: false });
  },
);

onBeforeUnmount(() => {
  editor.value?.destroy();
});

function toggleBold() {
  editor.value?.chain().focus().toggleBold().run();
}

function toggleItalic() {
  editor.value?.chain().focus().toggleItalic().run();
}

function toggleBulletList() {
  editor.value?.chain().focus().toggleBulletList().run();
}

function toggleOrderedList() {
  editor.value?.chain().focus().toggleOrderedList().run();
}

function isActive(name: string, attrs?: Record<string, unknown>) {
  return editor.value?.isActive(name, attrs) ?? false;
}
</script>

<template>
  <div class="rich-text-editor">
    <div v-if="editor" class="rich-text-editor__toolbar" role="toolbar" aria-label="Форматирование">
      <button
        type="button"
        class="rich-text-editor__btn"
        :class="{ 'is-active': isActive('bold') }"
        title="Жирный"
        @click="toggleBold"
      >
        B
      </button>
      <button
        type="button"
        class="rich-text-editor__btn"
        :class="{ 'is-active': isActive('italic') }"
        title="Курсив"
        @click="toggleItalic"
      >
        I
      </button>
      <button
        type="button"
        class="rich-text-editor__btn"
        :class="{ 'is-active': isActive('bulletList') }"
        title="Маркированный список"
        @click="toggleBulletList"
      >
        •
      </button>
      <button
        type="button"
        class="rich-text-editor__btn"
        :class="{ 'is-active': isActive('orderedList') }"
        title="Нумерованный список"
        @click="toggleOrderedList"
      >
        1.
      </button>
    </div>
    <EditorContent :editor="editor" class="rich-text-editor__body" />
  </div>
</template>

<style scoped>
.rich-text-editor {
  border: 1px solid #d1d5db;
  border-radius: 0;
  margin-bottom: 12px;
  background: #fff;
}

.rich-text-editor__toolbar {
  display: block;
  padding: 8px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 0;
}

.rich-text-editor__btn {
  display: inline-block;
  vertical-align: middle;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  margin-right: 4px;
  border: 1px solid #d1d5db;
  border-radius: 0;
  background: #fff;
  color: #374151;
  font: inherit;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}

.rich-text-editor__btn:hover {
  background: #f3f4f6;
}

.rich-text-editor__btn.is-active {
  background: #111827;
  border-color: #111827;
  color: #fff;
}

.rich-text-editor__body {
  padding: 12px;
}

:deep(.rich-text-editor__content) {
  min-height: 8rem;
  outline: none;
}

:deep(.rich-text-editor__content p) {
  margin: 0 0 8px;
}

:deep(.rich-text-editor__content p:last-child) {
  margin-bottom: 0;
}

:deep(.rich-text-editor__content ul),
:deep(.rich-text-editor__content ol) {
  margin: 0 0 8px;
  padding-left: 20px;
}

:deep(.rich-text-editor__content p.is-editor-empty:first-child::before) {
  color: #9ca3af;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
