<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { clearToken, getToken } from './lib/api';
import { useRouter } from 'vue-router';
import AdminIcon from './components/AdminIcon.vue';

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
        <RouterLink to="/series" class="header-nav-link">
          <AdminIcon name="list-icon" />
          Выпуски
        </RouterLink>
        <RouterLink to="/tours" class="header-nav-link">
          <AdminIcon name="layers-icon" />
          Туры
        </RouterLink>
        <button class="link-btn" type="button" @click="logout">
          <AdminIcon name="logout-icon" />
          Выйти
        </button>
      </nav>
    </header>
    <main class="main">
      <RouterView />
    </main>
  </div>
</template>
