<script setup lang="ts">
import { computed, ref } from 'vue';
import type { RoomState } from '@humiliation-game/shared';
import { connectSocket } from '../lib/api';
import LinkCopyField from './LinkCopyField.vue';
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

function onLinkCopied(label: string) {
  connectionMessage.value = `${label} скопирована`;
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
    <p v-if="introText" class="connection-intro">{{ introText }}</p>

    <div class="link-block">
      <strong>📺 Экран</strong>
      <p class="link-desc">
        TV, ноут, планшет — только показ. Можно открыть на нескольких устройствах.
      </p>
      <LinkCopyField :url="displayUrl" label="Ссылка экрана" @copied="onLinkCopied" />
    </div>

    <div v-if="state?.teamSlots?.length || mySlotUrl" class="link-block">
      <strong>📱 Команды</strong>
      <p class="link-desc">
        Джойстик команды. Любой телефон команды может подключиться —
        предыдущее устройство отключится.
      </p>

      <template v-if="state?.teamSlots?.length">
        <div v-for="slot in state.teamSlots" :key="slot.teamId" class="team-slot-row">
          <template v-if="slot.teamId === teamId">
            <div v-if="renamingTeam" class="rename-team-form">
              <label :for="`rename-team-input-${slot.teamId}`">Новое название</label>
              <input
                :id="`rename-team-input-${slot.teamId}`"
                v-model="renameDraft"
                class="input"
                placeholder="Название команды"
                @keyup.enter="saveRenameTeam"
              />
              <p v-if="renameError" class="rename-team-error">{{ renameError }}</p>
              <div class="rename-team-actions">
                <button class="btn" type="button" :disabled="renameLoading" @click="saveRenameTeam">
                  {{ renameLoading ? 'Сохранение...' : 'Сохранить' }}
                </button>
                <button
                  class="btn btn-secondary"
                  type="button"
                  :disabled="renameLoading"
                  @click="cancelRenameTeam"
                >
                  Отмена
                </button>
              </div>
            </div>
            <div v-else class="team-name-row">
              <span class="team-name">{{ slot.name }} <span class="team-you">(Вы)</span></span>
              <button
                type="button"
                class="team-rename-btn"
                aria-label="Переименовать команду"
                @click="startRenameTeam"
              >
                <svg class="team-rename-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#pencil-icon"></use>
                </svg>
              </button>
            </div>
          </template>
          <span v-else class="team-slot-name">{{ slot.name }}</span>

          <LinkCopyField
            :url="getTeamSlotUrl(roomCode, slot.teamId)"
            :label="slot.teamId === teamId ? 'Ссылка слота' : `Ссылка «${slot.name}»`"
            :highlight="slot.teamId === teamId"
            @copied="onLinkCopied"
          />
        </div>
      </template>

      <div v-else-if="mySlotUrl" class="team-slot-row">
        <div v-if="renamingTeam" class="rename-team-form">
          <label for="rename-team-input">Новое название</label>
          <input
            id="rename-team-input"
            v-model="renameDraft"
            class="input"
            placeholder="Название команды"
            @keyup.enter="saveRenameTeam"
          />
          <p v-if="renameError" class="rename-team-error">{{ renameError }}</p>
          <div class="rename-team-actions">
            <button class="btn" type="button" :disabled="renameLoading" @click="saveRenameTeam">
              {{ renameLoading ? 'Сохранение...' : 'Сохранить' }}
            </button>
            <button
              class="btn btn-secondary"
              type="button"
              :disabled="renameLoading"
              @click="cancelRenameTeam"
            >
              Отмена
            </button>
          </div>
        </div>
        <div v-else-if="teamName" class="team-name-row">
          <span class="team-name">{{ teamName }} <span class="team-you">(Вы)</span></span>
          <button
            type="button"
            class="team-rename-btn"
            aria-label="Переименовать команду"
            @click="startRenameTeam"
          >
            <svg class="team-rename-icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#pencil-icon"></use>
            </svg>
          </button>
        </div>

        <LinkCopyField
          :url="mySlotUrl"
          label="Ссылка слота"
          highlight
          @copied="onLinkCopied"
        />
      </div>

      <button
        v-if="!showAddTeamLink"
        type="button"
        class="btn btn-secondary add-team-btn"
        @click="addTeam"
      >
        Добавить команду
      </button>
      <div v-else class="add-team-link">
        <p class="link-desc">
          Чтобы добавить команду, откройте ссылку на другом устройстве или отсканируйте QR-код.
        </p>
        <LinkCopyField
          :url="joinUrl"
          label="Ссылка для новой команды"
          @copied="onLinkCopied"
        />
      </div>
    </div>

    <p v-if="connectionMessage" class="connection-copy-message">
      {{ connectionMessage }}
    </p>
  </div>
</template>

<style scoped>
.connection-intro {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1rem;
}

.connection-copy-message {
  margin: 1rem 0 0;
  color: #059669;
  font-size: 0.9375rem;
  font-weight: 600;
  text-align: center;
}

.rename-team-form {
  margin: 0 0 0.5rem;
}

.rename-team-form label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.875rem;
  color: #374151;
}

.rename-team-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.rename-team-error {
  color: #dc2626;
  font-size: 0.875rem;
  margin: 0.5rem 0 0;
}

.team-name-row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin: 0 0 0.35rem;
}

.team-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #4f46e5;
}

.team-you {
  font-weight: 500;
  color: #6b7280;
}

.team-rename-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  flex-shrink: 0;
}

.team-rename-btn:hover {
  background: #f3f4f6;
  color: #4f46e5;
}

.team-rename-icon {
  width: 1rem;
  height: 1rem;
}

.add-team-btn {
  width: 100%;
  margin-top: 0.75rem;
}

.add-team-link {
  margin-top: 0.75rem;
}
</style>
