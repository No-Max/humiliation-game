import { computed, readonly, ref } from 'vue';
import {
  type AuthUser,
  type TelegramLoginPayload,
  fetchAuthConfig,
  fetchAuthMe,
  loginWithTelegram,
  logoutAuth,
  updateProfile,
  uploadTeamLogo,
} from '../lib/authApi';
import { setPreferredTeamName } from '../lib/teamPreferences';

const user = ref<AuthUser | null>(null);
const loading = ref(false);
const ready = ref(false);
const botUsername = ref<string | null>(null);
let bootPromise: Promise<void> | null = null;

async function refresh() {
  loading.value = true;
  try {
    const [me, config] = await Promise.all([fetchAuthMe(), fetchAuthConfig()]);
    user.value = me.user;
    botUsername.value = config.telegramBotUsername;
    if (me.user?.teamName) {
      setPreferredTeamName(me.user.teamName);
    }
  } catch {
    user.value = null;
  } finally {
    loading.value = false;
    ready.value = true;
  }
}

export function useAuth() {
  if (!bootPromise) {
    bootPromise = refresh();
  }

  async function loginTelegram(payload: TelegramLoginPayload) {
    loading.value = true;
    try {
      const data = await loginWithTelegram(payload);
      user.value = data.user;
      if (data.user.teamName) {
        setPreferredTeamName(data.user.teamName);
      }
      return data.user;
    } finally {
      loading.value = false;
      ready.value = true;
    }
  }

  async function logout() {
    loading.value = true;
    try {
      await logoutAuth();
      user.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function saveTeamName(teamName: string) {
    const data = await updateProfile(teamName);
    user.value = data.user;
    if (data.user.teamName) {
      setPreferredTeamName(data.user.teamName);
    }
    return data.user;
  }

  async function saveTeamLogo(file: File) {
    const data = await uploadTeamLogo(file);
    user.value = data.user;
    return data.user;
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    ready: readonly(ready),
    botUsername: readonly(botUsername),
    isAuthenticated: computed(() => user.value != null),
    displayName: computed(() => {
      const u = user.value;
      if (!u) return '';
      return u.teamName || u.username || u.firstName || 'Профиль';
    }),
    avatarUrl: computed(() => {
      const u = user.value;
      if (!u) return null;
      return u.teamLogoUrl || u.photoUrl || null;
    }),
    refresh,
    loginTelegram,
    logout,
    saveTeamName,
    saveTeamLogo,
  };
}
