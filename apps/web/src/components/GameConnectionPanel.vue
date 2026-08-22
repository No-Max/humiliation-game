<script setup lang="ts">
import { computed, ref } from 'vue';
import type { RoomState } from '@humiliation-game/shared';
import { MAX_ROOM_TEAMS } from '@humiliation-game/shared';
import { connectSocket } from '../lib/api';
import LinkCopyField from './LinkCopyField.vue';
import Button from './Button.vue';
import Input from './Input.vue';
import {
  getDisplayUrl,
  getJoinUrl,
  getTeamSlotUrl,
} from '../lib/teamSession';

const props = defineProps<{
  roomCode: string;
  teamId: string;
  teamName: string;
  state: RoomState | null;
  introText?: string;
}>();

const emit = defineEmits<{
  'update:teamName': [name: string];
  teamRenamed: [name: string];
}>();

const connectionMessage = ref('');
const showAddTeamLink = ref(false);
const renamingTeam = ref(false);
const renameDraft = ref('');
const renameError = ref('');
const renameLoading = ref(false);

const displayUrl = computed(() => getDisplayUrl(props.roomCode));
const joinUrl = computed(() => getJoinUrl(props.roomCode));
const mySlotUrl = computed(() =>
  props.teamId ? getTeamSlotUrl(props.roomCode, props.teamId) : '',
);

const canAddTeam = computed(
  () => (props.state?.teamSlots.length ?? 0) < MAX_ROOM_TEAMS,
);

function onLinkCopied(label: string) {
  connectionMessage.value = `${label} скопирована`;
}

async function copyRoomCode() {
  await navigator.clipboard.writeText(props.roomCode);
  onLinkCopied('Код комнаты');
}

function addTeam() {
  showAddTeamLink.value = true;
}

function startRenameTeam() {
  renameDraft.value = props.teamName;
  renameError.value = '';
  renamingTeam.value = true;
}

function cancelRenameTeam() {
  renamingTeam.value = false;
  renameError.value = '';
}

function saveRenameTeam() {
  const nextName = renameDraft.value.trim();
  if (!nextName) {
    renameError.value = 'Введите название команды';
    return;
  }
  if (nextName === props.teamName) {
    renamingTeam.value = false;
    return;
  }

  renameLoading.value = true;
  renameError.value = '';
  connectSocket().emit('renameTeam', nextName, (result) => {
    renameLoading.value = false;
    if (!result.ok) {
      renameError.value = result.error ?? 'Не удалось переименовать';
      return;
    }
    if (result.teamName) {
      emit('update:teamName', result.teamName);
      emit('teamRenamed', result.teamName);
    }
    renamingTeam.value = false;
    connectionMessage.value = 'Название команды обновлено';
  });
}

function reset() {
  connectionMessage.value = '';
  renamingTeam.value = false;
  renameError.value = '';
  showAddTeamLink.value = false;
}

defineExpose({ reset });
</script>

<template>
  <div>
    <p v-if="introText" class="connection-intro text-muted-sm">{{ introText }}</p>

    <div class="link-block">
      <strong>📺 Экран</strong>
      <p class="link-desc text-muted-sm">
        TV, ноут, планшет — только показ. Можно открыть на нескольких устройствах.
      </p>
      <div v-if="roomCode" class="room-code-row">
        <div class="room-code-value-wrap">
          <span class="room-code-label text-muted-sm">Код комнаты: &nbsp;</span>
          <span class="room-code-value">{{ roomCode }}</span>
        </div>
        <Button variant="secondary" icon="copy" @click="copyRoomCode" class="room-code-copy" compact />
      </div>
      <p v-if="roomCode" class="link-desc room-code-hint text-muted-sm">
        Или введите код на экране через «Подключиться к игре» в шапке сайта.
      </p>
      <LinkCopyField :url="displayUrl" label="Ссылка экрана" @copied="onLinkCopied" />
    </div>

    <div v-if="state?.teamSlots?.length || mySlotUrl" class="link-block">
      <strong>📱 Команды</strong>
      <p class="link-desc text-muted-sm">
        Джойстик команды. Любой телефон команды может подключиться —
        предыдущее устройство отключится.
      </p>

      <template v-if="state?.teamSlots?.length">
        <div v-for="slot in state.teamSlots" :key="slot.teamId" class="team-slot-row">
          <template v-if="slot.teamId === teamId">
            <div v-if="renamingTeam" class="rename-team-form">
              <label :for="`rename-team-input-${slot.teamId}`">Новое название</label>
              <Input :id="`rename-team-input-${slot.teamId}`" v-model="renameDraft" placeholder="Название команды"
                @keyup.enter="saveRenameTeam" />
              <p v-if="renameError" class="rename-team-error text-error">{{ renameError }}</p>
              <div class="rename-team-actions">
                <Button :disabled="renameLoading" @click="saveRenameTeam">
                  {{ renameLoading ? 'Сохранение...' : 'Сохранить' }}
                </Button>
                <Button variant="secondary" :disabled="renameLoading" @click="cancelRenameTeam">
                  Отмена
                </Button>
              </div>
            </div>
            <div v-else class="team-name-row">
              <span class="team-name">{{ slot.name }} <span class="team-you text-muted">(Вы)</span></span>
              <Button variant="ghost" icon="pencil" aria-label="Переименовать команду" @click="startRenameTeam" />
            </div>
          </template>
          <span v-else class="team-slot-name">{{ slot.name }}</span>

          <LinkCopyField :url="getTeamSlotUrl(roomCode, slot.teamId)"
            :label="slot.teamId === teamId ? 'Ссылка слота' : `Ссылка «${slot.name}»`"
            :highlight="slot.teamId === teamId" @copied="onLinkCopied" />
        </div>
      </template>

      <div v-else-if="mySlotUrl" class="team-slot-row">
        <div v-if="renamingTeam" class="rename-team-form">
          <label for="rename-team-input">Новое название</label>
          <Input id="rename-team-input" v-model="renameDraft" placeholder="Название команды"
            @keyup.enter="saveRenameTeam" />
          <p v-if="renameError" class="rename-team-error text-error">{{ renameError }}</p>
          <div class="rename-team-actions">
            <Button :disabled="renameLoading" @click="saveRenameTeam">
              {{ renameLoading ? 'Сохранение...' : 'Сохранить' }}
            </Button>
            <Button variant="secondary" :disabled="renameLoading" @click="cancelRenameTeam">
              Отмена
            </Button>
          </div>
        </div>
        <div v-else-if="teamName" class="team-name-row">
          <span class="team-name">{{ teamName }} <span class="team-you text-muted">(Вы)</span></span>
          <Button variant="ghost" icon="pencil" aria-label="Переименовать команду" @click="startRenameTeam" />
        </div>

        <LinkCopyField :url="mySlotUrl" label="Ссылка слота" highlight @copied="onLinkCopied" />
      </div>

      <Button v-if="canAddTeam && !showAddTeamLink" variant="secondary" block class="add-team-btn" @click="addTeam"
        icon="copy">
        Добавить команду
      </Button>
      <p v-else-if="!canAddTeam" class="teams-limit-notice">
        Достигнут лимит — в комнате максимум {{ MAX_ROOM_TEAMS }} команды.
      </p>
      <div v-else class="add-team-link">
        <p class="link-desc text-muted-sm">
          Чтобы добавить команду, откройте ссылку на другом устройстве или отсканируйте QR-код.
        </p>
        <LinkCopyField :url="joinUrl" label="Ссылка для новой команды" @copied="onLinkCopied" />
      </div>
    </div>

    <p v-if="connectionMessage" class="connection-copy-message">
      {{ connectionMessage }}
    </p>
  </div>
</template>

<style scoped>
.link-block {
  margin-bottom: 20px;
}

.link-block:last-child {
  margin-bottom: 0;
}

.link-block strong {
  display: block;
  margin-bottom: 4px;
}

.link-desc {
  margin-bottom: 8px;
}

.team-slot-row {
  margin-top: 12px;
}

.team-slot-row:first-of-type {
  margin-top: 0;
}

.team-slot-name {
  display: block;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5.6px;
}

.room-code-row {
  display: block;
  margin-bottom: 8px;
}

.room-code-row::after {
  content: '';
  display: table;
  clear: both;
}

.room-code-row>div:first-child {
  display: inline-block;
  vertical-align: middle;
}

.room-code-copy {
  margin-left: 12px;
}

.room-code-label {
  display: inline-block;
  font-weight: bold;
  font-size: 16px;
}

.room-code-value {
  font-size: 26px;
  font-weight: bold;
  letter-spacing: 0.2em;
  font-variant-numeric: tabular-nums;
  color: #1a1a2e;
}

.room-code-hint {
  margin-top: 0;
  margin-bottom: 12px;
}

.connection-intro {
  margin: 0 0 16px;
}

.connection-copy-message {
  margin: 16px 0 0;
  color: #059669;
  font-size: 15px;
  font-weight: bold;
  text-align: center;
}

.rename-team-form {
  margin: 0 0 8px;
}

.rename-team-form label {
  display: block;
  margin-bottom: 5.6px;
  font-size: 14px;
  color: #374151;
}

.rename-team-actions {
  display: block;
  margin-top: 12px;
  font-size: 0;
}

.rename-team-actions>* {
  display: inline-block;
  vertical-align: middle;
  font-size: 16px;
  margin-right: 8px;
}

.team-name-row {
  display: block;
  font-size: 0;
  margin: 0 0 5.6px;
}

.team-name-row>* {
  display: inline-block;
  vertical-align: middle;
  font-size: 16px;
  margin-left: 6px;
}

.team-name-row>*:first-child {
  margin-left: 0;
}

.rename-team-error {
  margin: 8px 0 0;
}

.team-name {
  font-size: 15px;
  font-weight: bold;
  color: #4f46e5;
}

.team-you {
  font-weight: normal;
}

.add-team-btn {
  margin-top: 12px;
}

.teams-limit-notice {
  margin-top: 12px;
}

.add-team-link {
  margin-top: 12px;
}
</style>
