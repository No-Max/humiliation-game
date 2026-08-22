<script setup lang="ts">
import QRCode from 'qrcode';
import { ref } from 'vue';
import Button from './Button.vue';
import Input from './Input.vue';
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
      <Input
        variant="copy"
        :highlight="highlight"
        type="text"
        readonly
        :model-value="url"
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
