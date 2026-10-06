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
  <div class="app" :class="{ 'app--game': isGameLayout }">
    <div class="app-shell">
      <header v-if="!isGameLayout" class="header">
        <RouterLink to="/" class="logo">
          <img :src="logoUrl" alt="" class="logo__img" width="31" height="31" />
          <span class="logo__name">Игра<br />на унижение</span>
        </RouterLink>
        <div class="header-buttons">
          <Button
            class="header-qr-btn"
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
          <RouterLink to="/about">О нас</RouterLink>
        </nav>
      </header>
      <main class="main" :class="{ 'main--display': isDisplayLayout, 'main--game': isGameLayout }">
        <UnfinishedGamesPrompt v-if="!isGameLayout" />
        <RouterView />
      </main>
      <footer v-if="!isGameLayout" class="footer">
        <div class="footer-inner">
          <RouterLink to="/" class="footer-brand">
            <img :src="logoUrl" alt="" class="footer-brand__img" width="31" height="31" />
            <span class="footer-brand__name">Игра на унижение</span>
          </RouterLink>
          <nav class="footer-nav" aria-label="Навигация в подвале">
            <RouterLink to="/">Главная</RouterLink>
            <RouterLink to="/rules">Правила</RouterLink>
            <RouterLink to="/series">Выпуски</RouterLink>
            <RouterLink to="/about">О нас</RouterLink>
            <RouterLink v-if="hasUnfinished" to="/games">Незавершенные игры</RouterLink>
          </nav>
          <p class="footer-copy">
            © {{ new Date().getFullYear() }} Игра на унижение ·
            <a href="https://ingame.by" target="_blank" rel="noopener noreferrer">ingame.by</a>
          </p>
        </div>
      </footer>
    </div>
    <ConnectToGameModal :open="showConnectModal" @close="showConnectModal = false" />
    <RoomCodeQrScannerModal :open="showQrScanner" @close="showQrScanner = false" />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: block;
}

.app-shell {
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.app--game .app-shell {
  grid-template-rows: 1fr;
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
  text-decoration: none;
  color: #1a1a2e;
  font-weight: 600;
  font-size: 15px;
  line-height: 1.2;
}

.logo:hover {
  color: var(--color-accent);
}

.logo__img {
  display: inline-block;
  vertical-align: middle;
  height: 36px;
  width: auto;
  margin-right: 10px;
}

.logo__name {
  display: inline-block;
  vertical-align: middle;
  text-transform: uppercase;
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
  font-size: 16px;
  line-height: 22px;
  white-space: nowrap;
  color: #1a1a2e;
  font-weight: 600;
  text-decoration: none;
  text-transform: uppercase;
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

.header :deep(.header-watch-btn.btn),
.header :deep(.header-qr-btn.btn) {
  background: #52b685;
}

.header :deep(.header-watch-btn.btn:not(:disabled):hover),
.header :deep(.header-qr-btn.btn:not(:disabled):hover) {
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
  margin-top: 0;
  background: #fff;
  box-shadow: 0 -1px 3px rgb(0 0 0 / 8%);
  padding: 32px 16px;
  padding-bottom: max(32px, env(safe-area-inset-bottom, 0px));
  color: #6b7280;
  font-size: 14px;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.footer-inner::after {
  content: "";
  display: table;
  clear: both;
}

.footer-brand {
  display: inline-block;
  vertical-align: middle;
  text-decoration: none;
  color: #1a1a2e;
  font-weight: 600;
  font-size: 18px;
  line-height: 36px;
  margin-bottom: 16px;
}

.footer-brand:hover {
  color: var(--color-accent);
}

.footer-brand__img {
  display: inline-block;
  vertical-align: middle;
  height: 28px;
  width: auto;
  margin-right: 10px;
}

.footer-brand__name {
  display: inline-block;
  vertical-align: middle;
}

.footer-nav {
  display: block;
  margin-bottom: 20px;
}

.footer-nav > a {
  display: inline-block;
  vertical-align: middle;
  padding: 8px 12px 8px 0;
  margin-right: 8px;
  font-size: 16px;
  line-height: 24px;
  white-space: nowrap;
  color: #1a1a2e;
  font-weight: 600;
  text-decoration: none;
}

.footer-nav > a:hover {
  color: var(--color-accent);
}

.footer-nav > a.router-link-active {
  color: #1a1a2e;
  text-decoration: underline;
  text-decoration-color: #fec31b;
  text-decoration-thickness: 3px;
  text-underline-offset: 6px;
}

.footer-copy {
  margin: 0;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.header-buttons {
  display: inline-block;
  vertical-align: middle;
  text-align: right;
  float: right;
}

.header :deep(.header-qr-btn) {
  display: none;
}

@media (max-width: 768px) {
  .header {
    padding: 16px;
  }

  .header :deep(.header-qr-btn) {
    display: inline-block;
  }

  .header :deep(.header-watch-btn) {
    display: none;
  }

  .header nav {
    position: static;
    width: 100%;
    text-align: right;
    padding: 0;
    float: right;
  }

  .header nav a {
    font-size: 15px;
    padding-bottom: 4px;
    padding-top: 16px;
  }

  .main {
    padding: 16px;
  }
}
</style>
