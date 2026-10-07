<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import Button from '../components/Button.vue';
import Input from '../components/Input.vue';
import UnfinishedGamesList from '../components/UnfinishedGamesList.vue';
import { useAuth } from '../composables/useAuth';
import { useUnfinishedGames } from '../composables/useUnfinishedGames';
import { fetchMyGames, type SavedGameSummary } from '../lib/authApi';
import { formatPublishedAt } from '../lib/dates';

const router = useRouter();
const { user, ready, isAuthenticated, logout, saveTeamName, saveTeamLogo } = useAuth();
const {
  sessions,
  refresh: refreshUnfinished,
  dismiss,
} = useUnfinishedGames();

const teamName = ref('');
const message = ref('');
const error = ref('');
const saving = ref(false);
const uploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const history = ref<SavedGameSummary[]>([]);
const historyLoading = ref(false);
const historyError = ref('');

const avatarSrc = computed(
  () => user.value?.teamLogoUrl || user.value?.photoUrl || '',
);

onMounted(async () => {
  if (ready.value && !isAuthenticated.value) {
    router.replace('/');
    return;
  }
  await refreshUnfinished();
  if (isAuthenticated.value) await loadHistory();
});

watch(ready, async (value) => {
  if (value && !isAuthenticated.value) {
    router.replace('/');
    return;
  }
  if (value && isAuthenticated.value) {
    await refreshUnfinished();
    await loadHistory();
  }
});

watch(
  user,
  (next) => {
    teamName.value = next?.teamName ?? '';
  },
  { immediate: true },
);

async function loadHistory() {
  historyLoading.value = true;
  historyError.value = '';
  try {
    const data = await fetchMyGames();
    history.value = data.games;
  } catch (e) {
    historyError.value = e instanceof Error ? e.message : 'Не удалось загрузить историю';
    history.value = [];
  } finally {
    historyLoading.value = false;
  }
}

async function onSave() {
  message.value = '';
  error.value = '';
  saving.value = true;
  try {
    await saveTeamName(teamName.value);
    message.value = 'Сохранено';
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось сохранить';
  } finally {
    saving.value = false;
  }
}

async function onLogoSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  message.value = '';
  error.value = '';
  uploading.value = true;
  try {
    await saveTeamLogo(file);
    message.value = 'Логотип обновлён';
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить';
  } finally {
    uploading.value = false;
  }
}

async function onLogout() {
  await logout();
  router.push('/');
}
</script>

<template>
  <div>
    <h1 class="page-title">Профиль</h1>

    <div v-if="!ready" class="card">
      <p class="text-muted-sm">Загрузка…</p>
    </div>

    <template v-else-if="user">
      <div class="card profile-card">
        <div class="profile-logo-row">
          <img
            v-if="avatarSrc"
            :src="avatarSrc"
            alt=""
            class="profile-avatar"
            width="72"
            height="72"
          />
          <div v-else class="profile-avatar profile-avatar--empty" aria-hidden="true" />
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="profile-file"
            @change="onLogoSelected"
          />
          <Button
            class="profile-logo-btn"
            variant="secondary"
            icon="image"
            compact
            :disabled="uploading"
            aria-label="Загрузить картинку команды"
            @click="fileInput?.click()"
          />
        </div>
        <p v-if="user.username" class="profile-telegram text-muted-sm">@{{ user.username }}</p>

        <label class="profile-label">Название команды</label>
        <Input v-model="teamName" placeholder="Например: Знатоки" @keyup.enter="onSave" />

        <p v-if="message" class="profile-ok">{{ message }}</p>
        <p v-if="error" class="profile-error">{{ error }}</p>

        <div class="profile-actions">
          <Button :disabled="saving" @click="onSave">
            {{ saving ? 'Сохранение…' : 'Сохранить' }}
          </Button>
          <Button variant="secondary" @click="onLogout">Выйти</Button>
        </div>
      </div>

      <div v-if="sessions.length" class="card unfinished-games-card">
        <h2 class="section-title">Незавершённые игры</h2>
        <p class="section-intro text-muted-sm">
          Продолжите с того места, где остановились
        </p>
        <UnfinishedGamesList :sessions="sessions" @dismiss="dismiss" />
      </div>

      <div class="card history-card">
        <h2 class="section-title">Результаты игр</h2>
        <p v-if="historyLoading" class="text-muted-sm">Загрузка…</p>
        <p v-else-if="historyError" class="profile-error">{{ historyError }}</p>
        <p v-else-if="!history.length" class="text-muted-sm">
          Пока нет сохранённых результатов.
        </p>
        <ul v-else class="history-list">
          <li v-for="game in history" :key="game.roomCode" class="history-item">
            <RouterLink :to="`/series/${game.seriesId}`" class="history-title">
              #{{ game.seriesNumber }}: {{ game.seriesTitle }}
            </RouterLink>
            <p class="history-meta text-muted-sm">
              {{ game.myTeamName }} — {{ game.myScore }}
              <template v-if="game.finishedAt">
                · {{ formatPublishedAt(game.finishedAt) }}
              </template>
            </p>
            <p class="history-scores text-muted-sm">
              {{ game.teams.map((t) => `${t.name}: ${t.score}`).join(' · ') }}
            </p>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<style scoped>
.profile-card {
  margin-top: 16px;
}

.profile-logo-row {
  margin-bottom: 12px;
  font-size: 0;
}

.profile-avatar {
  display: inline-block;
  vertical-align: middle;
  width: 72px;
  height: 72px;
  object-fit: cover;
  margin-right: 12px;
  background: #f3f4f6;
}

.profile-avatar--empty {
  background: #e5e7eb;
}

.profile-logo-btn {
  vertical-align: middle;
}

.profile-file {
  display: none;
}

.profile-telegram {
  margin: 0 0 16px;
}

.profile-label {
  display: block;
  font-weight: bold;
  margin-bottom: 8px;
}

.profile-ok {
  margin: 0 0 12px;
  color: #059669;
  font-weight: bold;
}

.profile-error {
  margin: 0 0 12px;
  color: #dc2626;
}

.profile-actions {
  margin-top: 8px;
  font-size: 0;
}

.profile-actions > :deep(*) {
  display: inline-block;
  vertical-align: middle;
  margin-right: 8px;
  margin-bottom: 8px;
  font-size: 16px;
}

.unfinished-games-card {
  border-left: 4px solid var(--color-accent);
  margin-top: 16px;
}

.history-card {
  margin-top: 16px;
}

.section-title {
  margin-bottom: 8px;
}

.section-intro {
  margin-bottom: 16px;
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.history-item {
  padding: 12px 0;
  border-top: 1px solid #e5e7eb;
}

.history-item:first-child {
  border-top: none;
  padding-top: 0;
}

.history-title {
  font-weight: bold;
  color: inherit;
  text-decoration: none;
}

.history-title:hover {
  color: var(--color-accent);
}

.history-meta,
.history-scores {
  margin: 4px 0 0;
}
</style>
