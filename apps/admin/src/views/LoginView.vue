<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { adminApi, setToken } from '../lib/api';

const router = useRouter();
const email = ref('admin@game.local');
const password = ref('admin123');
const error = ref('');
const loading = ref(false);

async function login() {
  loading.value = true;
  error.value = '';
  try {
    const result = await adminApi<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.value, password: password.value }),
    });
    setToken(result.accessToken);
    router.push('/series');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка входа';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-wrap">
    <div class="card login-card">
      <h1 class="page-title">Admin</h1>
      <label class="label">Email</label>
      <input v-model="email" class="input" type="email" />
      <label class="label">Пароль</label>
      <input v-model="password" class="input" type="password" />
      <p v-if="error" class="error">{{ error }}</p>
      <button class="btn" :disabled="loading" @click="login">Войти</button>
    </div>
  </div>
</template>
