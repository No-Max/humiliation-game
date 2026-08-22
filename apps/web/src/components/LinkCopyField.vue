<script setup lang="ts">
import QRCode from 'qrcode';
import { ref } from 'vue';
import Button from './Button.vue';

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
          icon
          :aria-label="`Копировать ${label}`"
          @click="copy"
        >
          <svg class="link-copy-icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#copy-icon"></use>
          </svg>
        </Button>
      </div>
    </div>
    <Button
      icon
      icon-size="md"
      class="link-qr-btn"
      :aria-label="`QR-код: ${label}`"
      @click="openQr"
    >
      <svg class="link-qr-icon" role="presentation" aria-hidden="true">
        <use href="/icons.svg#qr-icon"></use>
      </svg>
    </Button>
  </div>

  <Teleport to="body">
    <div v-if="showQr" class="qr-overlay" @click.self="closeQr">
      <div class="qr-dialog" role="dialog" :aria-label="`QR-код: ${label}`">
        <div class="qr-dialog-header">
          <strong>{{ label }}</strong>
          <Button variant="close" aria-label="Закрыть" @click="closeQr">
            ×
          </Button>
        </div>
        <div class="qr-dialog-body">
          <p v-if="qrLoading" class="qr-loading">Генерация QR-кода…</p>
          <img v-else-if="qrDataUrl" :src="qrDataUrl" alt="" class="qr-image" />
          <p class="qr-hint">Отсканируйте камерой телефона, чтобы открыть ссылку</p>
        </div>
      </div>
    </div>
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

.link-copy-icon {
  width: 18px;
  height: 18px;
}

.link-qr-btn {
  margin-left: 8px;
}

.link-qr-icon {
  width: 18px;
  height: 18px;
}

.qr-overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 45%);
  z-index: 1100;
  padding: 16px;
  text-align: center;
  font-size: 0;
  white-space: nowrap;
  overflow: auto;
}

.qr-overlay::before {
  content: '';
  display: inline-block;
  height: 100%;
  vertical-align: middle;
}

.qr-dialog {
  display: inline-block;
  vertical-align: middle;
  white-space: normal;
  text-align: left;
  font-size: 16px;
  background: #fff;
  border-radius: 12px;
  width: min(100%, 320px);
  box-shadow: 0 20px 40px rgb(0 0 0 / 20%);
}

.qr-dialog-header {
  display: block;
  padding: 16px 20px 0;
}

.qr-dialog-header::after {
  content: '';
  display: table;
  clear: both;
}

.qr-dialog-header strong {
  display: inline-block;
  vertical-align: middle;
  font-size: 15px;
  max-width: calc(100% - 40px);
}

.qr-dialog-body {
  padding: 16px 20px 20px;
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
  color: #6b7280;
  font-size: 14px;
  padding: 64px 0;
}

.qr-hint {
  margin: 12px 0 0;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.4;
}
</style>
