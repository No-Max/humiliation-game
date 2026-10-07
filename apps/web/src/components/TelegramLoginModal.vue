<script setup lang="ts">
import { ref } from 'vue';
import Button from './Button.vue';
import ModalShell from './ModalShell.vue';
import TelegramLoginButton from './TelegramLoginButton.vue';
import { useAuth } from '../composables/useAuth';
import type { TelegramLoginPayload } from '../lib/authApi';

defineProps<{
  title?: string;
  description?: string;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const { botUsername, loginTelegram } = useAuth();
const error = ref('');
const submitting = ref(false);

async function onTelegramAuth(payload: TelegramLoginPayload) {
  error.value = '';
  submitting.value = true;
  try {
    await loginTelegram(payload);
    emit('success');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось войти';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <ModalShell title-id="tg-login-title" @close="$emit('close')">
    <template #header>
      <h2 id="tg-login-title">{{ title || 'Войти' }}</h2>
      <Button variant="close" aria-label="Закрыть" @click="$emit('close')" />
    </template>
    <p class="login-desc">
      {{
        description ||
        'Войдите с помощью Telegram, чтобы сохранять прогресс и результаты игр.'
      }}
    </p>
    <div v-if="botUsername" class="login-widget">
      <TelegramLoginButton
        :bot-username="botUsername"
        @auth="onTelegramAuth"
        @error="error = $event"
      />
    </div>
    <p v-else class="login-error">
      Вход через Telegram пока не настроен на сервере.
    </p>
    <p v-if="submitting" class="login-hint text-muted-sm">Входим…</p>
    <p v-if="error" class="login-error">{{ error }}</p>
  </ModalShell>
</template>

<style scoped>
.login-desc {
  margin: 0 0 16px;
}

.login-widget {
  margin-bottom: 8px;
}

.login-hint {
  margin: 8px 0 0;
}

.login-error {
  margin: 8px 0 0;
  color: #dc2626;
}
</style>
