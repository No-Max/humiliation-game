<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { clearToken, getToken } from './lib/api';
import { useRouter } from 'vue-router';

const router = useRouter();
const isLoggedIn = !!getToken();

function logout() {
  clearToken();
  router.push('/login');
}
</script>

<template>
  <div class="app">
    <header v-if="isLoggedIn" class="header">
      <span class="logo">Admin</span>
      <nav>
        <RouterLink to="/series">Выпуски</RouterLink>
        <RouterLink to="/tours">Туры</RouterLink>
        <button class="link-btn" @click="logout">Выйти</button>
      </nav>
    </header>
    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.link-btn {
  background: none;
  border: none;
  color: #4f46e5;
  cursor: pointer;
  font-size: 1rem;
}
</style>
