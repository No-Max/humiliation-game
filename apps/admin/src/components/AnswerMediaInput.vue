<script setup lang="ts">
import { formatMaxAnswerMediaSize } from '../lib/uploadLimits';
import AnswerMediaTypeField from './AnswerMediaTypeField.vue';

type AnswerMediaType = 'IMAGE' | 'AUDIO' | 'VIDEO';

interface AnswerMediaItem {
  url: string;
  type: AnswerMediaType;
}

const items = defineModel<AnswerMediaItem[]>({ default: () => [] });

function updateType(type: AnswerMediaType, ofType: AnswerMediaItem[]) {
  const images = type === 'IMAGE' ? ofType : items.value.filter((item) => item.type === 'IMAGE');
  const audios = type === 'AUDIO' ? ofType : items.value.filter((item) => item.type === 'AUDIO');
  const videos = type === 'VIDEO' ? ofType : items.value.filter((item) => item.type === 'VIDEO');
  items.value = [...images, ...audios, ...videos];
}
</script>

<template>
  <div class="answer-media-fields">
    <p class="field-hint answer-media-intro">
      Необязательно. Медиа показываются на экране правильного ответа — и когда кто-то ответил верно,
      и когда никто не угадал. Перетащите файлы в нужное поле или загрузите через кнопки.
      Максимальный размер одного файла — {{ formatMaxAnswerMediaSize() }}.
    </p>

    <AnswerMediaTypeField
      :items="items"
      type="IMAGE"
      label="Картинка"
      hint="Одна или несколько. Перетащите файлы сюда или вставьте картинку из буфера (Ctrl/⌘+V)."
      @update:items="updateType('IMAGE', $event)"
    />

    <AnswerMediaTypeField
      :items="items"
      type="AUDIO"
      label="Аудио"
      hint="Один аудиофайл. Перетащите файл сюда или загрузите новый — предыдущий заменится."
      @update:items="updateType('AUDIO', $event)"
    />

    <AnswerMediaTypeField
      :items="items"
      type="VIDEO"
      label="Видео"
      hint="Один видеофайл. Перетащите файл сюда или загрузите новый — предыдущий заменится."
      @update:items="updateType('VIDEO', $event)"
    />
  </div>
</template>

<style scoped>
.answer-media-fields {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.answer-media-intro {
  margin: 0;
}
</style>
