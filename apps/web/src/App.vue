<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import UnfinishedGamesBanner from './components/UnfinishedGamesBanner.vue';
</script>

<template>
  <div class="app">
    <header class="header">
      <RouterLink to="/" class="logo">Игра на унижение</RouterLink>
      <nav>
        <RouterLink to="/">Главная</RouterLink>
        <RouterLink to="/rules">Правила</RouterLink>
        <RouterLink to="/series">Выпуски</RouterLink>
      </nav>
    </header>
    <main class="main">
      <UnfinishedGamesBanner />
      <RouterView />
    </main>
    <footer class="footer">
      <p>© {{ new Date().getFullYear() }} Игра на унижение</p>
    </footer>
  </div>
</template>
