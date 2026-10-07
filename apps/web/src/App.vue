<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import Button from "./components/Button.vue";
import ConnectToGameModal from "./components/ConnectToGameModal.vue";
import RoomCodeQrScannerModal from "./components/RoomCodeQrScannerModal.vue";
import TelegramLoginModal from "./components/TelegramLoginModal.vue";
import UnfinishedGamesPrompt from "./components/UnfinishedGamesPrompt.vue";
import { useAuth } from "./composables/useAuth";
import { useUnfinishedGames } from "./composables/useUnfinishedGames";
import LogoAnimation from "./components/LogoAnimation.vue";
import logoUrl from "./assets/logo.svg";

const showConnectModal = ref(false);
const showQrScanner = ref(false);
const showLoginModal = ref(false);
const menuOpen = ref(false);
const headerEl = ref<HTMLElement | null>(null);
const route = useRoute();
const { hasUnfinished, refresh: refreshUnfinishedGames } = useUnfinishedGames();
const { isAuthenticated, displayName, avatarUrl } = useAuth();

onMounted(refreshUnfinishedGames);
const isDisplayLayout = computed(() => route.path.startsWith("/display/"));
const isGameLayout = computed(
  () =>
    route.path.startsWith("/display/") ||
    route.path.startsWith("/play/") ||
    route.path.startsWith("/team/")
);

function closeMenu() {
  menuOpen.value = false;
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function openConnectModal() {
  closeMenu();
  showConnectModal.value = true;
}

function openQrScanner() {
  closeMenu();
  showQrScanner.value = true;
}

watch(
  () => route.fullPath,
  () => {
    closeMenu();
  },
);

watch(menuOpen, (open) => {
  if (!open) return;

  const onPointerDown = (event: PointerEvent) => {
    const target = event.target as Node | null;
    if (!target) return;
    if (headerEl.value?.contains(target)) return;
    closeMenu();
  };

  nextTick(() => {
    document.addEventListener("pointerdown", onPointerDown, true);
  });

  return () => {
    document.removeEventListener("pointerdown", onPointerDown, true);
  };
});
</script>

<template>
  <div class="app" :class="{ 'app--game': isGameLayout }">
    <div class="app-shell">
      <header
        v-if="!isGameLayout"
        ref="headerEl"
        class="header"
        :class="{ 'header--menu-open': menuOpen }"
      >
        <RouterLink to="/" class="logo" @click="closeMenu">
          <LogoAnimation class="logo__img" />
          <span class="logo__name">Игра<br />на унижение</span>
        </RouterLink>
        <button
          type="button"
          class="burger"
          :aria-expanded="menuOpen"
          aria-controls="header-menu"
          aria-label="Меню"
          @click="toggleMenu"
        >
          <span class="burger-line" />
          <span class="burger-line" />
          <span class="burger-line" />
        </button>
        <div id="header-menu" class="header-panel" :class="{ 'header-panel--open': menuOpen }">
          <nav>
            <RouterLink to="/">Главная</RouterLink>
            <RouterLink to="/rules">Правила</RouterLink>
            <RouterLink to="/series">Выпуски</RouterLink>
            <RouterLink to="/about">О нас</RouterLink>
          </nav>
          <div class="header-buttons">
            <Button
              class="header-qr-btn"
              icon="scan"
              aria-label="Сканировать QR-код"
              @click="openQrScanner"
            >
              QR
            </Button>
            <Button class="header-play-btn" to="/series" icon="play" @click="closeMenu">
              Играть
            </Button>
            <Button class="header-watch-btn" icon="tv" @click="openConnectModal">
              Смотреть
            </Button>
          </div>
        </div>
      </header>
      <main class="main" :class="{ 'main--display': isDisplayLayout, 'main--game': isGameLayout }">
        <UnfinishedGamesPrompt v-if="!isGameLayout" />
        <RouterView />
      </main>
      <footer v-if="!isGameLayout" class="footer">
        <div class="footer-inner">
          <RouterLink to="/" class="footer-brand">
            <img :src="logoUrl" alt="" class="footer-brand__img" width="32" height="32" />
            <span class="footer-brand__name">Игра на унижение</span>
          </RouterLink>
          <nav class="footer-nav" aria-label="Навигация в подвале">
            <RouterLink to="/">Главная</RouterLink>
            <RouterLink to="/rules">Правила</RouterLink>
            <RouterLink to="/series">Выпуски</RouterLink>
            <RouterLink to="/about">О нас</RouterLink>
            <RouterLink v-if="hasUnfinished || isAuthenticated" to="/games">Игры</RouterLink>
            <RouterLink v-if="isAuthenticated" to="/profile">Профиль</RouterLink>
          </nav>
          <div class="footer-auth">
            <template v-if="isAuthenticated">
              <Button
                class="footer-auth-btn"
                :class="{ 'footer-auth-btn--avatar': !!avatarUrl }"
                to="/profile"
                variant="secondary"
                :icon="avatarUrl ? undefined : 'user'"
                compact
              >
                <img
                  v-if="avatarUrl"
                  :src="avatarUrl"
                  alt=""
                  class="footer-auth-avatar"
                  width="24"
                  height="24"
                />
                <span class="footer-auth-name">{{ displayName }}</span>
              </Button>
            </template>
            <template v-else>
              <Button class="footer-auth-btn" compact @click="showLoginModal = true">
                Войти
              </Button>
              <span class="footer-auth-hint text-muted-sm">
                Войдите с помощью Telegram, чтобы сохранять прогресс в играх
              </span>
            </template>
          </div>
          <p class="footer-copy">
            © {{ new Date().getFullYear() }} Игра на унижение ·
            <a href="https://ingame.by" target="_blank" rel="noopener noreferrer">ingame.by</a>
          </p>
        </div>
      </footer>
    </div>
    <ConnectToGameModal :open="showConnectModal" @close="showConnectModal = false" />
    <RoomCodeQrScannerModal :open="showQrScanner" @close="showQrScanner = false" />
    <TelegramLoginModal
      v-if="showLoginModal"
      @close="showLoginModal = false"
      @success="showLoginModal = false"
    />
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
  z-index: 40;
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
  position: relative;
  z-index: 2;
}

.logo:hover {
  color: var(--color-accent);
}

.logo__img {
  display: inline-block;
  vertical-align: middle;
  width: 32px;
  height: 32px;
  margin-right: 10px;
  object-fit: contain;
}

.logo__name {
  display: inline-block;
  vertical-align: middle;
  text-transform: uppercase;
}

.burger {
  display: none;
  float: right;
  position: relative;
  z-index: 2;
  width: 40px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 0;
  background: #fec31b;
  cursor: pointer;
  box-sizing: border-box;
}

.burger-line {
  display: block;
  position: absolute;
  left: 8px;
  right: 8px;
  height: 3px;
  margin: 0;
  background: #1a1a2e;
  top: 50%;
  transition: transform 0.15s, opacity 0.15s;
}

.burger-line:nth-child(1) {
  transform: translateY(-9px);
}

.burger-line:nth-child(2) {
  transform: translateY(-1.5px);
}

.burger-line:nth-child(3) {
  transform: translateY(6px);
}

.header--menu-open .burger-line:nth-child(1) {
  transform: translateY(-1.5px) rotate(45deg);
}

.header--menu-open .burger-line:nth-child(2) {
  opacity: 0;
}

.header--menu-open .burger-line:nth-child(3) {
  transform: translateY(-1.5px) rotate(-45deg);
}

.header-panel {
  display: block;
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

.header-buttons {
  display: inline-block;
  vertical-align: middle;
  text-align: right;
  float: right;
  position: relative;
  z-index: 2;
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

.header :deep(.header-play-btn.btn) {
  background: var(--color-accent);
}

.header :deep(.header-play-btn.btn:not(:disabled):hover) {
  background: var(--color-accent-hover);
}

.header :deep(.header-qr-btn),
.header :deep(.header-play-btn) {
  display: none;
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
  width: 32px;
  height: 32px;
  margin-right: 10px;
  object-fit: contain;
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

.footer-auth {
  margin: 0 0 20px;
  font-size: 0;
}

.footer-auth-btn {
  display: inline-block;
  vertical-align: middle;
  margin-right: 12px;
}

.footer-auth-avatar {
  display: inline-block;
  vertical-align: middle;
  width: 24px;
  height: 24px;
  margin-right: 8px;
  object-fit: cover;
  background: #d1d5db;
}

.footer-auth-name {
  display: inline-block;
  vertical-align: middle;
}

.footer-auth-hint {
  display: inline-block;
  vertical-align: middle;
  margin: 0;
  max-width: calc(100% - 100px);
  font-size: 14px;
  line-height: 1.4;
}

.footer-copy {
  margin: 0;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

@media (max-width: 768px) {
  .header {
    padding: 12px 16px;
  }

  .burger {
    display: inline-block;
  }

  .header-panel {
    display: none;
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    width: auto;
    margin: 0;
    padding: 16px;
    border-top: 1px solid #e5e7eb;
    background: #fff;
    box-shadow: 0 8px 16px rgb(0 0 0 / 10%);
    z-index: 3;
  }

  .header-panel--open {
    display: block;
  }

  .header nav {
    position: static;
    width: 100%;
    text-align: left;
    padding: 0;
    float: none;
  }

  .header nav > a {
    display: block;
    padding: 12px 0;
    font-size: 15px;
    border-bottom: 1px solid #f3f4f6;
  }

  .header nav > a:first-child {
    padding-left: 0;
  }

  .header-buttons {
    float: none;
    display: block;
    text-align: left;
    margin-top: 16px;
  }

  .header :deep(.btn) {
    margin: 0 8px 8px 0;
  }

  .header :deep(.header-qr-btn),
  .header :deep(.header-play-btn) {
    display: inline-block;
  }

  .header :deep(.header-watch-btn) {
    display: none;
  }

  .footer-nav {
    text-align: left;
  }

  .footer-nav > a {
    font-size: 13px;
    padding: 6px 12px 6px 0;
    margin-right: 0;
  }

  .main {
    padding: 16px;
  }
}
</style>
