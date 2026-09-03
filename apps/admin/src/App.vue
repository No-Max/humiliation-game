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
      <nav class="header-nav">
        <RouterLink to="/series" class="header-nav-link">
          <AdminIcon name="list-icon" />
          Выпуски
        </RouterLink>
        <RouterLink to="/tours" class="header-nav-link">
          <AdminIcon name="layers-icon" />
          Туры
        </RouterLink>
        <RouterLink to="/media" class="header-nav-link">
          <AdminIcon name="publish-icon" />
          Галерея
        </RouterLink>
      </nav>
      <div class="header-actions">
        <button class="link-btn" type="button" @click="logout">
          <AdminIcon name="logout-icon" />
          Выйти
        </button>
      </div>
    </header>
    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: #111827;
  color: #fff;
}

.header a {
  color: #e5e7eb;
  text-decoration: none;
}

.header a:hover {
  color: #fff;
}

.header a.router-link-active {
  color: #fff;
  font-weight: 600;
}

.header-nav {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-self: center;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-self: end;
}

.header-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.header-nav-link :deep(.icon) {
  width: 1.125em;
  height: 1.125em;
}

.link-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: none;
  border: none;
  color: #e5e7eb;
  cursor: pointer;
  font: inherit;
  font-size: inherit;
  padding: 0;
  text-decoration: none;
}

.link-btn:hover {
  color: #fff;
}

.link-btn :deep(.icon) {
  width: 1.125em;
  height: 1.125em;
}

.main {
  padding: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .header {
    padding: 1rem;
  }

  .header-nav {
    gap: 0.5rem;
  }

  .main {
    padding: 1rem;
  }
}
</style>
