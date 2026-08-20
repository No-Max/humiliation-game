<script setup lang="ts">
import { computed, ref } from 'vue';
import AdminIcon from './AdminIcon.vue';
import {
  formatFileSize,
  formatMediaDate,
  mediaKind,
  mediaKindLabel,
  type MediaLibraryItem,
} from '../lib/mediaLibrary';

const props = defineProps<{
  item: MediaLibraryItem;
  selected?: boolean;
  selectable?: boolean;
  editable?: boolean;
  deleting?: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
  rename: [filename: string];
  delete: [];
}>();

const editing = ref(false);
const draftName = ref('');
const copied = ref(false);
const kind = computed(() => mediaKind(props.item.mimeType));

function startRename() {
  draftName.value = props.item.filename;
  editing.value = true;
}

function cancelRename() {
  editing.value = false;
}

function saveRename() {
  const name = draftName.value.trim();
  if (!name || name === props.item.filename) {
    editing.value = false;
    return;
  }
  emit('rename', name);
  editing.value = false;
}

function onCardClick() {
  if (props.selectable) {
    emit('toggle');
  }
}

async function copyUrl() {
  const url = new URL(props.item.url, window.location.origin).href;
  try {
    await navigator.clipboard.writeText(url);
    copied.value = true;
    window.setTimeout(() => {
      copied.value = false;
    }, 1500);
  } catch {
    window.prompt('Скопируйте ссылку', url);
  }
}
</script>

<template>
  <article
    class="media-card"
    :class="{ 'media-card-selected': selected, 'media-card-selectable': selectable }"
    @click="onCardClick"
  >
    <div v-if="selectable" class="media-card-check" aria-hidden="true">
      <span class="media-card-check-box">{{ selected ? '✓' : '' }}</span>
    </div>

    <div class="media-card-preview">
      <a
        v-if="kind === 'image' && !selectable"
        :href="item.url"
        target="_blank"
        rel="noopener noreferrer"
        class="media-card-image-link"
        :title="`Открыть «${item.filename}»`"
        @click.stop
      >
        <img
          :src="item.url"
          :alt="item.filename"
          class="media-card-image"
        />
      </a>
      <img
        v-else-if="kind === 'image'"
        :src="item.url"
        :alt="item.filename"
        class="media-card-image"
      />
      <div v-else class="media-card-placeholder">
        <span class="media-card-kind">{{ mediaKindLabel(kind!) }}</span>
        <span class="media-card-ext">{{ item.url.split('.').pop() }}</span>
      </div>
    </div>

    <div class="media-card-body" @click.stop>
      <form v-if="editing && editable" class="media-card-rename" @submit.prevent="saveRename">
        <input v-model="draftName" class="input" type="text" />
        <div class="media-card-rename-actions">
          <button class="btn btn-secondary btn-sm" type="button" @click="cancelRename">
            Отмена
          </button>
          <button class="btn btn-sm" type="submit">Сохранить</button>
        </div>
      </form>
      <template v-else>
        <p class="media-card-title" :title="item.filename">{{ item.filename }}</p>
        <p class="media-card-meta">
          {{ formatFileSize(item.size) }} · {{ formatMediaDate(item.createdAt) }}
        </p>
        <div v-if="editable" class="media-card-actions">
          <button
            class="btn btn-secondary btn-sm btn-icon"
            type="button"
            :aria-label="copied ? 'Ссылка скопирована' : 'Копировать ссылку'"
            :title="copied ? 'Ссылка скопирована' : 'Копировать ссылку'"
            @click="copyUrl"
          >
            <AdminIcon :name="copied ? 'check-icon' : 'copy-icon'" />
          </button>
          <button
            class="btn btn-secondary btn-sm btn-icon"
            type="button"
            aria-label="Переименовать"
            title="Переименовать"
            @click="startRename"
          >
            <AdminIcon name="pencil-icon" />
          </button>
          <button
            class="btn btn-danger btn-sm btn-icon"
            type="button"
            aria-label="Удалить"
            title="Удалить"
            :disabled="deleting"
            @click="emit('delete')"
          >
            <AdminIcon name="trash-icon" />
          </button>
        </div>
      </template>
    </div>
  </article>
</template>

<style scoped>
.media-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.media-card-selectable {
  cursor: pointer;
}

.media-card-selectable:hover {
  border-color: #4f46e5;
}

.media-card-selected {
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

.media-card-check {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 1;
}

.media-card-check-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 4px;
  background: rgb(255 255 255 / 92%);
  border: 2px solid #4f46e5;
  color: #4f46e5;
  font-size: 0.875rem;
  font-weight: 700;
}

.media-card-preview {
  flex-shrink: 0;
  height: 160px;
  background: #f3f4f6;
}

.media-card-image-link {
  display: block;
  width: 100%;
  height: 100%;
  cursor: zoom-in;
}

.media-card-image-link:hover .media-card-image {
  opacity: 0.92;
}

.media-card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: opacity 0.15s ease;
}

.media-card-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  color: #6b7280;
  padding: 0.75rem;
  text-align: center;
}

.media-card-kind {
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
}

.media-card-ext {
  font-size: 0.75rem;
  word-break: break-all;
}

.media-card-body {
  flex: 1;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.media-card-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.media-card-meta {
  margin: 0;
  font-size: 0.75rem;
  color: #6b7280;
}

.media-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: auto;
  padding-top: 0.25rem;
}

.media-card-rename {
  display: grid;
  gap: 0.5rem;
}

.media-card-rename .input {
  margin-bottom: 0;
}

.media-card-rename-actions {
  display: flex;
  gap: 0.35rem;
}
</style>
