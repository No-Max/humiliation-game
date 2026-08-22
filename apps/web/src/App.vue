<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import ConnectToGameModal from './components/ConnectToGameModal.vue';
import UnfinishedGamesBanner from './components/UnfinishedGamesBanner.vue';

const showConnectModal = ref(false);
</script>

<template>
  <div class="app">
    <header class="header">
      <RouterLink to="/" class="logo">Игра на унижение</RouterLink>
      <nav>
        <RouterLink to="/">Главная</RouterLink>
        <RouterLink to="/rules">Правила</RouterLink>
        <RouterLink to="/series">Выпуски</RouterLink>
        <button
          type="button"
          class="header-connect-btn"
          @click="showConnectModal = true"
        >
          Подключиться к игре
        </button>
      </nav>
    </header>
    <main class="main">
      <UnfinishedGamesBanner />
      <RouterView />
    </main>
    <footer class="footer">
      <p>© {{ new Date().getFullYear() }} Игра на унижение</p>
    </footer>
    <ConnectToGameModal :open="showConnectModal" @close="showConnectModal = false" />
  </div>
</template>
