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
