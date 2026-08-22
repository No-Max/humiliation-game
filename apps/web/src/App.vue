<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import Button from './components/Button.vue';
import ConnectToGameModal from './components/ConnectToGameModal.vue';
import UnfinishedGamesBanner from './components/UnfinishedGamesBanner.vue';

const showConnectModal = ref(false);
const route = useRoute();
const isDisplayLayout = computed(() => route.path.startsWith('/display/'));
const isGameLayout = computed(
  () =>
    route.path.startsWith('/display/')
    || route.path.startsWith('/play/')
    || route.path.startsWith('/team/'),
);
</script>

<template>
  <div class="app">
    <header v-if="!isGameLayout" class="header">
      <RouterLink to="/" class="logo">Игра на унижение</RouterLink>
      <nav>
        <RouterLink to="/">Главная</RouterLink>
        <RouterLink to="/rules">Правила</RouterLink>
        <RouterLink to="/series">Выпуски</RouterLink>
        <Button @click="showConnectModal = true">
          Подключиться к игре
        </Button>
      </nav>
    </header>
    <main
      class="main"
      :class="{ 'main--display': isDisplayLayout, 'main--game': isGameLayout }"
    >
      <UnfinishedGamesBanner v-if="!isGameLayout" />
      <RouterView />
    </main>
    <footer v-if="!isGameLayout" class="footer">
      <p>© {{ new Date().getFullYear() }} Игра на унижение</p>
    </footer>
    <ConnectToGameModal :open="showConnectModal" @close="showConnectModal = false" />
  </div>
</template>
