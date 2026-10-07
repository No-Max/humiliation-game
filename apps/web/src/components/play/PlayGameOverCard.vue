<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { GameQuestionResult, TeamState } from '@humiliation-game/shared';
import Button from '../Button.vue';
import PlayGameResultsTable from './PlayGameResultsTable.vue';
import TelegramLoginModal from '../TelegramLoginModal.vue';
import { useAuth } from '../../composables/useAuth';
import { claimGame } from '../../lib/authApi';

const props = defineProps<{
  teams: TeamState[];
  tableTeams: TeamState[];
  gameResults?: GameQuestionResult[];
  roomCode?: string;
  teamId?: string;
}>();

defineEmits<{
  finish: [];
}>();

const { isAuthenticated, ready } = useAuth();
const showLogin = ref(false);
const saved = ref(false);
const saveError = ref('');
const saving = ref(false);

async function tryClaim() {
  if (!props.roomCode || !props.teamId || !isAuthenticated.value) return;
  saving.value = true;
  saveError.value = '';
  try {
    await claimGame(props.roomCode, props.teamId);
    saved.value = true;
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : 'Не удалось сохранить';
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  if (ready.value && isAuthenticated.value) {
    void tryClaim();
  }
});

watch([ready, isAuthenticated], ([isReady, authed]) => {
  if (isReady && authed && !saved.value) {
    void tryClaim();
  }
});

async function onLoginSuccess() {
  showLogin.value = false;
  await tryClaim();
}
</script>

<template>
  <div class="card game-over-card">
    <div class="banner correct tour-results">
      <p class="tour-results-title">Игра окончена!</p>
      <p v-for="team in teams" :key="team.id" class="tour-results-row">
        {{ team.name }} — {{ team.score }}
      </p>
    </div>
    <PlayGameResultsTable
      v-if="gameResults?.length"
      :results="gameResults"
      :teams="tableTeams"
    />

    <div v-if="roomCode && teamId" class="save-block">
      <template v-if="saved">
        <p class="save-ok">Результаты сохранены в вашем профиле</p>
      </template>
      <template v-else-if="isAuthenticated">
        <p v-if="saving" class="text-muted-sm">Сохраняем результаты…</p>
        <p v-else-if="saveError" class="save-error">{{ saveError }}</p>
        <Button v-else variant="secondary" @click="tryClaim">Сохранить результаты</Button>
      </template>
      <template v-else>
        <p class="save-hint">
          Войдите через Telegram, чтобы сохранить результаты этой игры.
        </p>
        <Button @click="showLogin = true">Сохранить через Telegram</Button>
      </template>
    </div>

    <Button class="game-over-btn" @click="$emit('finish')">Завершить игру</Button>

    <TelegramLoginModal
      v-if="showLogin"
      title="Сохранить результаты"
      description="Войдите с помощью Telegram, чтобы сохранить результаты этой игры в профиле."
      @close="showLogin = false"
      @success="onLoginSuccess"
    />
  </div>
</template>

<style scoped>
.game-over-card {
  margin-top: 16px;
}

.save-block {
  margin-top: 16px;
}

.save-hint {
  margin: 0 0 12px;
  color: #6b7280;
  font-size: 14px;
}

.save-ok {
  margin: 0;
  color: #059669;
  font-weight: bold;
}

.save-error {
  margin: 0 0 8px;
  color: #dc2626;
}

.game-over-btn {
  margin-top: 16px;
}
</style>
