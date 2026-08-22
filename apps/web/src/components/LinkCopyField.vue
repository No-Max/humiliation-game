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
