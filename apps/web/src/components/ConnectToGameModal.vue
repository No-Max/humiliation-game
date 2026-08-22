<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../lib/api';
import Button from './Button.vue';
import ModalShell from './ModalShell.vue';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();
const code = ref('');
const error = ref('');
const loading = ref(false);

const canSubmit = computed(() => code.value.length === 6 && !loading.value);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    code.value = '';
    error.value = '';
    loading.value = false;
  },
);

function onCodeInput(event: Event) {
  const input = event.target as HTMLInputElement;
  code.value = input.value.replace(/\D/g, '').slice(0, 6);
  input.value = code.value;
  error.value = '';
}

function close() {
  emit('close');
}

async function connect() {
  if (!canSubmit.value) return;

  loading.value = true;
  error.value = '';

  try {
    await api(`/rooms/${code.value}`);
    emit('close');
    await router.push(`/display/${code.value}`);
  } catch {
    error.value = 'Игра с таким кодом не найдена';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <ModalShell v-if="open" title-id="connect-game-title" @close="close">
    <template #header>
      <h2 id="connect-game-title">Подключиться к игре</h2>
      <Button variant="close" aria-label="Закрыть" @click="close">
        ×
      </Button>
    </template>
    <div class="connect-game-modal">
      <p class="connect-game-hint text-muted">
        Введите 6-значный код комнаты, чтобы открыть игру на этом экране.
      </p>
      <label class="connect-game-label" for="room-code-input">Код комнаты</label>
      <input
        id="room-code-input"
        class="input connect-game-code"
        type="text"
        inputmode="numeric"
        autocomplete="one-time-code"
        maxlength="6"
        placeholder="000000"
        :value="code"
        @input="onCodeInput"
      />
      <p v-if="error" class="connect-game-error text-error">{{ error }}</p>
      <Button
        block
        class="connect-game-submit"
        :disabled="!canSubmit"
        @click="connect"
      >
        {{ loading ? 'Подключение…' : 'Подключиться' }}
      </Button>
    </div>
  </ModalShell>
</template>

<style scoped>
.connect-game-modal {
  display: block;
}

.connect-game-modal > * + * {
  margin-top: 12px;
}

.connect-game-hint {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
}

.connect-game-label {
  font-size: 14px;
  font-weight: bold;
  color: #374151;
}

.connect-game-code {
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 0.2em;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.connect-game-error {
  margin: 0;
  font-size: 14px;
}

.connect-game-submit {
  margin-top: 4px;
}
</style>
