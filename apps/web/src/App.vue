<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import Button from "./components/Button.vue";
import ConnectToGameModal from "./components/ConnectToGameModal.vue";
import RoomCodeQrScannerModal from "./components/RoomCodeQrScannerModal.vue";
import UnfinishedGamesBanner from "./components/UnfinishedGamesBanner.vue";

const showConnectModal = ref(false);
const showQrScanner = ref(false);
const route = useRoute();
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
      <RouterLink to="/" class="logo">Игра на унижение</RouterLink>
      <nav>
        <RouterLink to="/">Главная</RouterLink>
        <RouterLink to="/rules">Правила</RouterLink>
        <RouterLink to="/series">Выпуски</RouterLink>
        <div class="header-buttons">
          <Button
            variant="secondary"
            icon="scan"
            aria-label="Сканировать QR-код"
            @click="showQrScanner = true"
          >
            QR
          </Button>
          <Button icon="tv" @click="showConnectModal = true"> Смотреть </Button>
        </div>
      </nav>
    </header>
    <main class="main" :class="{ 'main--display': isDisplayLayout, 'main--game': isGameLayout }">
      <UnfinishedGamesBanner v-if="!isGameLayout" />
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
  border-bottom: 1px solid #e5e7eb;
}

.header::after {
  content: "";
  display: table;
  clear: both;
}

.logo {
  float: left;
  display: inline-block;
  font-weight: bold;
  font-size: 20px;
  line-height: 44px;
  color: #1a1a2e;
}

.header nav {
  float: right;
  display: inline-block;
  max-width: 100%;
  text-align: right;
  vertical-align: middle;
  width: calc(100% - 200px);
  text-align: center;
}

.header nav a {
  display: inline-block;
  vertical-align: middle;
  padding: 12px 8px;
  line-height: 20px;
  white-space: nowrap;
}

.header nav a:first-child {
  padding-left: 0;
}

.header :deep(.btn) {
  float: right;
  margin-left: 8px;
}

.main {
  display: block;
  padding: 32px;
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

@media (max-width: 768px) {
  .header {
    padding: 16px;
  }

  .header nav {
    width: 100%;
    text-align: left;
  }

  .main {
    padding: 16px;
  }
}
</style>
