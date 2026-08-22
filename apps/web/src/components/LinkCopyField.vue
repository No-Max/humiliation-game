<script setup lang="ts">
import QRCode from 'qrcode';
import { ref } from 'vue';
import Button from './Button.vue';
import ModalShell from './ModalShell.vue';

const props = defineProps<{
  url: string;
  label: string;
  highlight?: boolean;
}>();

const emit = defineEmits<{
  copied: [label: string];
}>();

const showQr = ref(false);
const qrDataUrl = ref('');
const qrLoading = ref(false);

async function copy() {
  await navigator.clipboard.writeText(props.url);
  emit('copied', props.label);
}

async function openQr() {
  showQr.value = true;
  qrLoading.value = true;
  qrDataUrl.value = '';
  try {
    qrDataUrl.value = await QRCode.toDataURL(props.url, {
      margin: 2,
      width: 240,
      errorCorrectionLevel: 'M',
    });
  } finally {
    qrLoading.value = false;
  }
}

function closeQr() {
  showQr.value = false;
}

function selectAll(event: FocusEvent) {
  (event.target as HTMLInputElement).select();
}
</script>

<template>
  <div class="link-copy-row">
    <div class="link-copy-field">
      <input
        class="link-copy-input"
        :class="{ highlight }"
        type="text"
        readonly
        :value="url"
        @focus="selectAll"
      />
      <div class="link-copy-btn-wrap">
        <Button
          variant="ghost"
          icon="copy"
          :aria-label="`Копировать ${label}`"
          @click="copy"
        />
      </div>
    </div>
    <Button
      icon="qr"
      class="link-qr-btn"
      :aria-label="`QR-код: ${label}`"
      @click="openQr"
    />
  </div>

  <Teleport to="body">
    <ModalShell v-if="showQr" title-id="qr-dialog-title" @close="closeQr">
      <template #header>
        <h2 id="qr-dialog-title">{{ label }}</h2>
        <Button variant="close" aria-label="Закрыть" @click="closeQr">
          ×
        </Button>
      </template>
      <div class="qr-dialog-body">
        <p v-if="qrLoading" class="qr-loading text-muted-sm">Генерация QR-кода…</p>
        <img v-else-if="qrDataUrl" :src="qrDataUrl" alt="" class="qr-image" />
        <p class="qr-hint text-muted-sm">Отсканируйте камерой телефона, чтобы открыть ссылку</p>
      </div>
    </ModalShell>
  </Teleport>
</template>

<style scoped>
.link-copy-row {
  display: block;
  font-size: 0;
  min-width: 0;
}

.link-copy-field {
  display: inline-block;
  vertical-align: middle;
  position: relative;
  width: calc(100% - 46px);
  min-width: 0;
  font-size: 14px;
}

.link-copy-input {
  width: 100%;
  box-sizing: border-box;
  font-size: 14px;
  font-family: inherit;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 40px 8px 12px;
  color: #374151;
  outline: none;
}

.link-copy-input:focus {
  border-color: #a5b4fc;
  box-shadow: 0 0 0 2px rgb(79 70 229 / 15%);
}

.link-copy-input.highlight {
  color: #4f46e5;
}

.link-copy-btn-wrap {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
}

.link-qr-btn {
  margin-left: 8px;
}

.qr-dialog-body {
  text-align: center;
}

.qr-image {
  display: block;
  width: 240px;
  height: 240px;
  margin: 0 auto;
  border-radius: 8px;
}

.qr-loading {
  padding: 64px 0;
}

.qr-hint {
  margin: 12px 0 0;
  line-height: 1.4;
}
</style>
