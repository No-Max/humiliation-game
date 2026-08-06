<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, connectSocket, joinRoom } from '../lib/api';
import { getTeamSlotPath, rememberTeamSlot } from '../lib/teamSession';

interface RoomTeam {
  id: string;
  name: string;
}

const route = useRoute();
const router = useRouter();
const teamName = ref('');
const error = ref('');
const loading = ref(false);
const existingTeams = ref<RoomTeam[]>([]);

onMounted(async () => {
  connectSocket();
  try {
    const room = await api<{ teams: RoomTeam[] }>(`/rooms/${route.params.code}`);
    existingTeams.value = room.teams;
  } catch {
    // room not found handled on join
  }
});

function goToSlot(code: string, teamId: string, name: string, seriesTitle = 'Игра') {
  rememberTeamSlot(code, teamId, name, seriesTitle, 'WAITING');
  router.push(getTeamSlotPath(code, teamId));
}

async function joinNew() {
  if (!teamName.value.trim()) {
    error.value = 'Введите название команды';
    return;
  }
  loading.value = true;
  error.value = '';
  const code = route.params.code as string;

  let seriesTitle = 'Игра';
  try {
    const room = await api<{ series: { title: string } }>(`/rooms/${code}`);
    seriesTitle = room.series.title;
  } catch {
    // ignore
  }

  joinRoom(
    { roomCode: code, role: 'team', teamName: teamName.value.trim() },
    (result) => {
      loading.value = false;
      if (!result.ok) {
        error.value = result.error ?? 'Не удалось подключиться';
        return;
      }
      if (result.teamId) {
        goToSlot(code, result.teamId, result.teamName ?? teamName.value.trim(), seriesTitle);
      }
    },
  );
}

function reconnectAs(team: RoomTeam) {
  loading.value = true;
  error.value = '';
  const code = route.params.code as string;

  joinRoom(
    { roomCode: code, role: 'team', teamId: team.id },
    async (result) => {
      loading.value = false;
      if (!result.ok) {
        error.value = result.error ?? 'Не удалось занять слот';
        return;
      }
      if (result.teamId) {
        let seriesTitle = 'Игра';
        try {
          const room = await api<{ series: { title: string } }>(`/rooms/${code}`);
          seriesTitle = room.series.title;
        } catch {
          // ignore
        }
        goToSlot(code, result.teamId, result.teamName ?? team.name, seriesTitle);
      }
    },
  );
}
</script>

<template>
  <div>
    <h1 class="page-title">Новая команда</h1>
    <p style="margin-bottom: 1rem">Код комнаты: <strong>{{ route.params.code }}</strong></p>

    <div class="card" style="margin-bottom: 1rem">
      <p style="color: #6b7280; margin-bottom: 0.75rem">
        Эта страница — только для команды, которая ещё не в игре.
        Если телефон выключился — откройте <strong>ссылку командного слота</strong>,
        которую сохранили в начале игры.
      </p>
      <input v-model="teamName" class="input" placeholder="Название новой команды" />
      <button class="btn" :disabled="loading" @click="joinNew">
        {{ loading ? 'Подключение...' : 'Войти' }}
      </button>
    </div>

    <div v-if="existingTeams.length" class="card">
      <h3 style="margin-bottom: 0.5rem">Уже в игре</h3>
      <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.75rem">
        Занять слот существующей команды (если потеряли ссылку):
      </p>
      <div style="display: grid; gap: 0.5rem">
        <button
          v-for="team in existingTeams"
          :key="team.id"
          class="btn btn-secondary"
          :disabled="loading"
          @click="reconnectAs(team)"
        >
          {{ team.name }}
        </button>
      </div>
    </div>

    <p v-if="error" style="color: #dc2626; margin-top: 1rem">{{ error }}</p>
  </div>
</template>
