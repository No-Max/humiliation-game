<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import Button from '../components/Button.vue';
import Input from '../components/Input.vue';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { user, ready, isAuthenticated, logout, saveTeamName, saveTeamLogo } = useAuth();

const teamName = ref('');
const message = ref('');
const error = ref('');
const saving = ref(false);
const uploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

onMounted(() => {
  if (ready.value && !isAuthenticated.value) {
    router.replace('/');
  }
});

watch(ready, (value) => {
  if (value && !isAuthenticated.value) {
    router.replace('/');
  }
});

watch(
  user,
  (next) => {
    teamName.value = next?.teamName ?? '';
  },
  { immediate: true },
);

async function onSaveName() {
  message.value = '';
  error.value = '';
  saving.value = true;
  try {
    await saveTeamName(teamName.value);
    message.value = 'Название команды сохранено';
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

    <div v-else-if="user" class="card profile-card">
      <div class="profile-head">
        <img
          v-if="user.teamLogoUrl || user.photoUrl"
          :src="user.teamLogoUrl || user.photoUrl || ''"
          alt=""
          class="profile-avatar"
          width="72"
          height="72"
        />
        <div class="profile-head-text">
          <p class="profile-name">
            {{ user.teamName || user.username || user.firstName || 'Игрок' }}
          </p>
          <p v-if="user.username" class="text-muted-sm">@{{ user.username }}</p>
        </div>
      </div>

      <label class="profile-label">Название команды</label>
      <Input v-model="teamName" placeholder="Например: Знатоки" @keyup.enter="onSaveName" />
      <Button :disabled="saving" @click="onSaveName">Сохранить название</Button>

      <label class="profile-label profile-label--spaced">Логотип команды</label>
      <p class="text-muted-sm profile-hint">JPG или PNG, до 2 МБ</p>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="profile-file"
        @change="onLogoSelected"
      />
      <Button variant="secondary" :disabled="uploading" @click="fileInput?.click()">
        {{ uploading ? 'Загрузка…' : 'Загрузить картинку' }}
      </Button>

      <p v-if="message" class="profile-ok">{{ message }}</p>
      <p v-if="error" class="profile-error">{{ error }}</p>

      <Button variant="secondary" class="profile-logout" @click="onLogout">Выйти</Button>
    </div>
  </div>
</template>

<style scoped>
.profile-card {
  margin-top: 16px;
}

.profile-head {
  margin-bottom: 20px;
  font-size: 0;
}

.profile-avatar {
  display: inline-block;
  vertical-align: middle;
  width: 72px;
  height: 72px;
  object-fit: cover;
  margin-right: 16px;
  background: #f3f4f6;
}

.profile-head-text {
  display: inline-block;
  vertical-align: middle;
  font-size: 16px;
  max-width: calc(100% - 88px);
}

.profile-name {
  margin: 0 0 4px;
  font-weight: bold;
  font-size: 1.125rem;
}

.profile-label {
  display: block;
  font-weight: bold;
  margin-bottom: 8px;
}

.profile-label--spaced {
  margin-top: 24px;
}

.profile-hint {
  margin: 0 0 8px;
}

.profile-file {
  display: none;
}

.profile-ok {
  margin-top: 12px;
  color: #059669;
  font-weight: bold;
}

.profile-error {
  margin-top: 12px;
  color: #dc2626;
}

.profile-logout {
  margin-top: 24px;
}
</style>
