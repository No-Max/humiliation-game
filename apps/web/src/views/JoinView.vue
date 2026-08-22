<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MAX_ROOM_TEAMS } from '@humiliation-game/shared';
import { api, connectSocket, joinRoom } from '../lib/api';
import { getTeamSlotPath, rememberTeamSlot } from '../lib/teamSession';
import { getPreferredTeamName } from '../lib/teamPreferences';
import Button from '../components/Button.vue';

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

const teamsFull = computed(() => existingTeams.value.length >= MAX_ROOM_TEAMS);

onMounted(async () => {
  teamName.value = getPreferredTeamName();
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
  if (teamsFull.value) {
    error.value = `В комнате уже максимум ${MAX_ROOM_TEAMS} команд`;
    return;
  }
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
    <p style="margin-bottom: 16px">Код комнаты: <strong>{{ route.params.code }}</strong></p>

    <div class="card" style="margin-bottom: 16px">
      <p style="color: #6b7280; margin-bottom: 12px">
        Эта страница — только для команды, которая ещё не в игре.
        Если телефон выключился — откройте <strong>ссылку командного слота</strong>,
        которую сохранили в начале игры.
      </p>
      <p v-if="teamsFull" class="teams-limit-notice">
        В комнате уже {{ MAX_ROOM_TEAMS }} команды — новую добавить нельзя.
      </p>
      <template v-else>
        <input v-model="teamName" class="input" placeholder="Название новой команды" />
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 12px">
          Название сохраняется на этом устройстве — его можно изменить перед входом.
        </p>
        <Button :disabled="loading" @click="joinNew">
          {{ loading ? 'Подключение...' : 'Войти' }}
        </Button>
      </template>
    </div>

    <div v-if="existingTeams.length" class="card">
      <h3 style="margin-bottom: 8px">Уже в игре</h3>
      <p style="font-size: 14px; color: #6b7280; margin-bottom: 12px">
        Занять слот существующей команды (если потеряли ссылку):
      </p>
      <div style="display: grid; gap: 8px">
        <Button
          v-for="team in existingTeams"
          :key="team.id"
          variant="secondary"
          :disabled="loading"
          @click="reconnectAs(team)"
        >
          {{ team.name }}
        </Button>
      </div>
    </div>

    <p v-if="error" style="color: #dc2626; margin-top: 16px">{{ error }}</p>
  </div>
</template>

<style scoped>
.teams-limit-notice {
  margin: 0;
  color: #92400e;
  font-size: 14px;
  font-weight: 600;
}
</style>
