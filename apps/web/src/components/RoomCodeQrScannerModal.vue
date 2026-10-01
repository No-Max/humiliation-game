<script setup lang="ts">
import { Html5Qrcode } from 'html5-qrcode';
import { nextTick, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../lib/api';
import { parseRoomCodeFromScan } from '../lib/roomCode';
import Button from './Button.vue';
import ModalShell from './ModalShell.vue';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();
const error = ref('');
const loading = ref(false);
const scannerReady = ref(false);

const SCANNER_ELEMENT_ID = 'room-code-qr-scanner';
let scanner: Html5Qrcode | null = null;
let handlingScan = false;

function close() {
  emit('close');
}

async function stopScanner() {
  scannerReady.value = false;
  if (!scanner) return;
  try {
    if (scanner.isScanning) {
      await scanner.stop();
    }
  } catch {
    /* ignore stop races */
  }
  scanner.clear();
  scanner = null;
}

async function startScanner() {
  await nextTick();
  error.value = '';
  handlingScan = false;
  loading.value = false;

  scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
  try {
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1 },
      onScanSuccess,
      () => {},
    );
    scannerReady.value = true;
  } catch {
    error.value =
      'Не удалось открыть камеру. Разрешите доступ в настройках браузера или введите код вручную.';
    await stopScanner();
  }
}

async function onScanSuccess(decodedText: string) {
  if (handlingScan || loading.value) return;

  const code = parseRoomCodeFromScan(decodedText);
  if (!code) {
    error.value = 'QR-код не содержит код комнаты';
    return;
  }

  handlingScan = true;
  loading.value = true;
  error.value = '';

  try {
    await api(`/rooms/${code}`);
    await stopScanner();
    emit('close');
    await router.push(`/display/${code}`);
  } catch {
    error.value = 'Игра с таким кодом не найдена';
    handlingScan = false;
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      await startScanner();
    } else {
      await stopScanner();
    }
  },
);

onUnmounted(() => {
  void stopScanner();
});
</script>

<template>
  <ModalShell v-if="open" title-id="qr-scanner-title" @close="close">
    <template #header>
      <h2 id="qr-scanner-title">Сканировать QR-код</h2>
      <Button variant="close" aria-label="Закрыть" @click="close" />
    </template>
    <div class="qr-scanner-modal">
      <p class="qr-scanner-hint text-muted-sm">
        Наведите камеру на QR-код экрана или ссылки на игру.
      </p>
      <div class="qr-scanner-viewport">
        <div :id="SCANNER_ELEMENT_ID" class="qr-scanner-mount" />
        <p v-if="loading" class="qr-scanner-status">Подключение…</p>
      </div>
      <p v-if="error" class="qr-scanner-error text-error">{{ error }}</p>
      <p v-else-if="scannerReady && !loading" class="qr-scanner-status text-muted-sm">
        Камера активна
      </p>
    </div>
  </ModalShell>
</template>

<style scoped>
.qr-scanner-modal {
  display: block;
}

.qr-scanner-hint {
  margin: 0 0 12px;
  line-height: 1.45;
}

.qr-scanner-viewport {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background: #111827;
  min-height: 280px;
}

.qr-scanner-mount {
  width: 100%;
}

.qr-scanner-mount :deep(video) {
  border-radius: 12px;
}

.qr-scanner-status {
  margin: 12px 0 0;
  text-align: center;
  font-size: 14px;
}

.qr-scanner-error {
  margin: 12px 0 0;
  font-size: 14px;
  text-align: center;
}
</style>
