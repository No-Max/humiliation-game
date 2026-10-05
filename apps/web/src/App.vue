<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import Button from "./components/Button.vue";
import ConnectToGameModal from "./components/ConnectToGameModal.vue";
import RoomCodeQrScannerModal from "./components/RoomCodeQrScannerModal.vue";
import UnfinishedGamesPrompt from "./components/UnfinishedGamesPrompt.vue";
import { useUnfinishedGames } from "./composables/useUnfinishedGames";
import logoUrl from "./assets/logo.svg";

const showConnectModal = ref(false);
const showQrScanner = ref(false);
const route = useRoute();
const { hasUnfinished, refresh: refreshUnfinishedGames } = useUnfinishedGames();

onMounted(refreshUnfinishedGames);
const isDisplayLayout = computed(() => route.path.startsWith("/display/"));
const isGameLayout = computed(
  () =>
    route.path.startsWith("/display/") ||
    route.path.startsWith("/play/") ||
    route.path.startsWith("/team/")
);
</script>

<template>
  <div class="app">
    <header v-if="!isGameLayout" class="header">
      <RouterLink to="/" class="logo">
        <img :src="logoUrl" alt="Игра на унижение" class="logo__img" width="31" height="31" />
      </RouterLink>
      <div class="header-buttons">
        <Button
          variant="secondary"
          icon="scan"
          aria-label="Сканировать QR-код"
          @click="showQrScanner = true"
        >
          QR
        </Button>
        <Button class="header-watch-btn" icon="tv" @click="showConnectModal = true">
          Смотреть
        </Button>
      </div>
      <nav>
        <RouterLink to="/">Главная</RouterLink>
        <RouterLink to="/rules">Правила</RouterLink>
        <RouterLink to="/series">Выпуски</RouterLink>
        <RouterLink v-if="hasUnfinished" to="/games">Игры</RouterLink>
      </nav>
    </header>
    <main class="main" :class="{ 'main--display': isDisplayLayout, 'main--game': isGameLayout }">
      <UnfinishedGamesPrompt v-if="!isGameLayout" />
      <RouterView />
    </main>
    <footer v-if="!isGameLayout" class="footer">
      <p>© {{ new Date().getFullYear() }} Игра на унижение</p>
    </footer>
    <ConnectToGameModal :open="showConnectModal" @close="showConnectModal = false" />
    <RoomCodeQrScannerModal :open="showQrScanner" @close="showQrScanner = false" />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: block;
}

.header {
  display: block;
  padding: 16px 32px;
  background: #fff;
  box-shadow: 0 1px 3px rgb(0 0 0 / 8%);
  position: relative;
}

.header::after {
  content: "";
  display: table;
  clear: both;
}

.logo {
  float: left;
  display: inline-block;
  line-height: 44px;
  text-decoration: none;
}

.logo__img {
  display: inline-block;
  vertical-align: middle;
  height: 36px;
  width: auto;
}

.header nav {
  width: 100%;
  text-align: center;
  position: absolute;
  top: 0;
  left: 0;
  padding: 16px 32px;
}

.header nav > a {
  display: inline-block;
  vertical-align: middle;
  padding: 12px 8px;
  font-size: 20px;
  line-height: 24px;
  white-space: nowrap;
  color: #1a1a2e;
  font-weight: 600;
  text-decoration: none;
}

.header nav > a:hover {
  color: #1a1a2e;
}

.header nav > a.router-link-active {
  color: #1a1a2e;
  font-weight: 600;
  text-decoration: underline;
  text-decoration-color: #fec31b;
  text-decoration-thickness: 3px;
  text-underline-offset: 6px;
}

.header nav > a:first-child {
  padding-left: 0;
}

.header :deep(.btn) {
  margin-left: 8px;
}

.header :deep(.header-watch-btn.btn) {
  background: #52b685;
}

.header :deep(.header-watch-btn.btn:not(:disabled):hover) {
  background: #3a9a6a;
}

.main {
  display: block;
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  min-width: 0;
}

.main--display {
  max-width: 1400px;
  padding-left: max(32px, 2vw);
  padding-right: max(32px, 2vw);
}

.main--game {
  padding-top: 16px;
  padding-bottom: max(16px, env(safe-area-inset-bottom, 0px));
}

.main--game.main--display {
  padding-top: 24px;
}

.footer {
  text-align: center;
  padding: 16px;
  padding-bottom: max(16px, env(safe-area-inset-bottom, 0px));
  color: #6b7280;
  font-size: 14px;
}

.header-buttons {
  display: inline-block;
  vertical-align: middle;
  text-align: right;
  float: right;
}

@media (max-width: 1200px) {
  .header nav {
    padding-right: 200px;
  }
}

@media (max-width: 768px) {
  .header {
    padding: 16px;
  }

  .header nav {
    position: static;
    width: 100%;
    text-align: right;
    padding: 0;
    float: right;
  }

  .header nav a {
    font-size: 18px;
    padding-bottom: 4px;
    padding-top: 16px;
  }

  .main {
    padding: 16px;
  }
}
</style>
