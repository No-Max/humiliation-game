<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../lib/api';
import { getPreferredTeamName } from '../lib/teamPreferences';
import { getTeamSlotPath, rememberTeamSlot } from '../lib/teamSession';

const route = useRoute();
const router = useRouter();
const teamName = ref('');
const loading = ref(false);
const error = ref('');

onMounted(() => {
  teamName.value = getPreferredTeamName();
});

async function createRoom() {
  if (!teamName.value.trim()) {
    error.value = 'Введите название команды';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const result = await api<{
      roomCode: string;
      teamId: string;
      seriesTitle?: string;
    }>('/rooms', {
      method: 'POST',
      body: JSON.stringify({
        seriesId: route.params.seriesId,
        teamName: teamName.value.trim(),
      }),
    });
    rememberTeamSlot(
      result.roomCode,
      result.teamId,
      teamName.value.trim(),
      result.seriesTitle ?? 'Игра',
      'WAITING',
    );
    router.push(getTeamSlotPath(result.roomCode, result.teamId));
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <h1 class="page-title">Создать игру</h1>
    <div class="card">
      <label>Название вашей команды</label>
      <input v-model="teamName" class="input" placeholder="Например: Знатоки" />
      <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.75rem">
        Название сохраняется на этом устройстве — его можно изменить перед игрой.
      </p>
      <p v-if="error" style="color: #dc2626; margin-bottom: 0.75rem">{{ error }}</p>
      <button class="btn" :disabled="loading" @click="createRoom">
        {{ loading ? 'Создание...' : 'Создать комнату' }}
      </button>
    </div>
  </div>
</template>
