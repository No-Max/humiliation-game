<script setup lang="ts">
import { computed, ref } from 'vue';
import type { RoomState } from '@humiliation-game/shared';
import { MAX_ROOM_TEAMS, MAX_TEAM_NAME_LENGTH } from '@humiliation-game/shared';
import { connectSocket } from '../lib/api';
import LinkCopyField from './LinkCopyField.vue';
import Button from './Button.vue';
import Input from './Input.vue';
import ModalShell from './ModalShell.vue';
import {
  getJoinUrl,
  getTeamSlotUrl,
} from '../lib/teamSession';

const props = withDefaults(
  defineProps<{
    roomCode: string;
    teamId: string;
    teamName: string;
    state: RoomState | null;
    introText?: string;
    /** Для лобби: только блок участников. */
    section?: 'teams' | 'all';
  }>(),
  { section: 'all' },
);

const showTeams = computed(() => props.section === 'teams' || props.section === 'all');
const collapseOwnTeamLink = computed(() => props.section === 'teams');
const showOwnTeamTransfer = ref(false);

const emit = defineEmits<{
  'update:teamName': [name: string];
  teamRenamed: [name: string];
  teamLeft: [];
}>();

const connectionMessage = ref('');
const renamingTeam = ref(false);
const renameDraft = ref('');
const renameError = ref('');
const renameLoading = ref(false);
const removingTeamId = ref<string | null>(null);
const pendingRemove = ref<{ teamId: string; name: string } | null>(null);
const removeError = ref('');

const pendingRemoveIsSelf = computed(
  () => pendingRemove.value?.teamId === props.teamId,
);

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

function revealOwnTeamTransfer() {
  showOwnTeamTransfer.value = true;
}

function askRemoveTeam(targetTeamId: string, targetName: string) {
  removeError.value = '';
  pendingRemove.value = { teamId: targetTeamId, name: targetName };
}

function closeRemoveModal() {
  if (removingTeamId.value) return;
  pendingRemove.value = null;
  removeError.value = '';
}

function confirmRemoveTeam() {
  const pending = pendingRemove.value;
  if (!pending) return;

  const isSelf = pending.teamId === props.teamId;
  removingTeamId.value = pending.teamId;
  connectionMessage.value = '';
  removeError.value = '';
  connectSocket().emit('removeTeam', pending.teamId, (result) => {
    removingTeamId.value = null;
    if (!result.ok) {
      removeError.value = result.error ?? 'Не удалось удалить команду';
      return;
    }
    pendingRemove.value = null;
    if (isSelf) {
      emit('teamLeft');
      return;
    }
    connectionMessage.value = `Команда «${pending.name}» удалена`;
  });
}

function reset() {
  connectionMessage.value = '';
  renamingTeam.value = false;
  renameError.value = '';
  removingTeamId.value = null;
  pendingRemove.value = null;
  removeError.value = '';
  showOwnTeamTransfer.value = false;
}

defineExpose({ reset });
</script>

<template>
  <div>
    <p v-if="introText" class="connection-intro text-muted-sm">{{ introText }}</p>

    <div v-if="showTeams && (state?.teamSlots?.length || mySlotUrl)" class="link-block">
      <strong class="connection-section-heading">Команды</strong>

      <template v-if="state?.teamSlots?.length">
        <div v-for="slot in state.teamSlots" :key="slot.teamId" class="team-slot-row">
          <template v-if="slot.teamId === teamId">
            <div v-if="renamingTeam" class="rename-team-form">
              <label :for="`rename-team-input-${slot.teamId}`">Новое название</label>
              <Input
                :id="`rename-team-input-${slot.teamId}`"
                v-model="renameDraft"
                :maxlength="MAX_TEAM_NAME_LENGTH"
                placeholder="Название команды"
                @keyup.enter="saveRenameTeam"
              />
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
              <div class="team-name-actions">
                <Button
                  icon="pencil"
                  class="rename-team-btn"
                  aria-label="Переименовать команду"
                  @click="startRenameTeam"
                />
                <Button
                  icon="trash"
                  class="remove-team-btn"
                  aria-label="Покинуть игру"
                  :disabled="removingTeamId === slot.teamId || (state?.teamSlots.length ?? 0) <= 1"
                  @click="askRemoveTeam(slot.teamId, slot.name)"
                />
              </div>
              <span class="team-name">{{ slot.name }} <span class="team-you text-muted">(Вы)</span></span>
            </div>
          </template>
          <div v-else class="team-name-row team-name-row--other">
            <div class="team-name-actions">
              <Button
                icon="trash"
                class="remove-team-btn"
                :aria-label="`Удалить команду ${slot.name}`"
                :disabled="removingTeamId === slot.teamId || (state?.teamSlots.length ?? 0) <= 1"
                @click="askRemoveTeam(slot.teamId, slot.name)"
              />
            </div>
            <span class="team-slot-name">{{ slot.name }}</span>
          </div>

          <template v-if="slot.teamId === teamId && collapseOwnTeamLink && !showOwnTeamTransfer">
            <Button variant="secondary" block class="transfer-control-btn" @click="revealOwnTeamTransfer">
              Передать управление
            </Button>
          </template>
          <LinkCopyField
            v-else-if="!(slot.teamId === teamId && collapseOwnTeamLink && !showOwnTeamTransfer)"
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
          <Input
            id="rename-team-input"
            v-model="renameDraft"
            :maxlength="MAX_TEAM_NAME_LENGTH"
            placeholder="Название команды"
            @keyup.enter="saveRenameTeam"
          />
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
          <div class="team-name-actions">
            <Button
              icon="pencil"
              class="rename-team-btn"
              aria-label="Переименовать команду"
              @click="startRenameTeam"
            />
            <Button
              icon="trash"
              class="remove-team-btn"
              aria-label="Покинуть игру"
              :disabled="removingTeamId === teamId"
              @click="askRemoveTeam(teamId, teamName)"
            />
          </div>
          <span class="team-name">{{ teamName }} <span class="team-you text-muted">(Вы)</span></span>
        </div>

        <Button
          v-if="collapseOwnTeamLink && !showOwnTeamTransfer"
          variant="secondary"
          block
          class="transfer-control-btn"
          @click="revealOwnTeamTransfer"
        >
          Передать управление
        </Button>
        <LinkCopyField
          v-else
          :url="mySlotUrl"
          label="Ссылка слота"
          highlight
          @copied="onLinkCopied"
        />
      </div>

      <div v-if="canAddTeam" class="add-team-section">
        <strong class="connection-section-heading">Добавить соперника</strong>
        <p class="link-desc text-muted-sm">
          Чтобы добавить соперника, откройте ссылку на другом устройстве или отсканируйте QR-код (сканнер доступен в шапке).
        </p>
        <LinkCopyField :url="joinUrl" label="Ссылка для новой команды" @copied="onLinkCopied" />
      </div>
      <p v-else class="teams-limit-notice">
        Достигнут лимит — в комнате максимум {{ MAX_ROOM_TEAMS }} команды.
      </p>
    </div>

    <p v-if="connectionMessage" class="connection-copy-message">
      {{ connectionMessage }}
    </p>

    <ModalShell
      v-if="pendingRemove"
      title-id="remove-team-title"
      @close="closeRemoveModal"
    >
      <template #header>
        <h2 id="remove-team-title">
          {{ pendingRemoveIsSelf ? 'Покинуть игру?' : 'Удалить команду?' }}
        </h2>
        <Button
          variant="close"
          aria-label="Закрыть"
          :disabled="!!removingTeamId"
          @click="closeRemoveModal"
        />
      </template>
      <p class="remove-team-message">
        <template v-if="pendingRemoveIsSelf">
          Покинуть игру и удалить вашу команду из комнаты?
        </template>
        <template v-else>
          Удалить команду «{{ pendingRemove.name }}» из игры?
        </template>
      </p>
      <p v-if="removeError" class="remove-team-error text-error">{{ removeError }}</p>
      <div class="modal-actions">
        <Button :disabled="!!removingTeamId" @click="confirmRemoveTeam">
          {{
            removingTeamId
              ? 'Удаление...'
              : pendingRemoveIsSelf
                ? 'Покинуть'
                : 'Удалить'
          }}
        </Button>
        <Button variant="secondary" :disabled="!!removingTeamId" @click="closeRemoveModal">
          Отмена
        </Button>
      </div>
    </ModalShell>
  </div>
</template>

<style scoped>
.link-block {
  margin-bottom: 20px;
}

.link-block:last-child {
  margin-bottom: 0;
}

.link-desc {
  margin-bottom: 8px;
}

.team-slot-row {
  margin-top: 16px;
}

.team-slot-row:first-of-type {
  margin-top: 0;
}

.team-name-row--other {
  margin-bottom: 5.6px;
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
  margin: 0 0 12px;
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
  margin: 0 0 5.6px;
}

.team-name-row::after {
  content: '';
  display: table;
  clear: both;
}

.team-name-actions {
  float: right;
  font-size: 0;
  margin-left: 8px;
}

.team-name-actions > :deep(*) {
  display: inline-block;
  vertical-align: middle;
  margin-left: 6px;
}

.team-name-actions > :deep(*:first-child) {
  margin-left: 0;
}

.team-name,
.team-slot-name {
  display: block;
  overflow: hidden;
  line-height: 32px;
  font-weight: bold;
}

.team-slot-name {
  font-size: 16px;
}

.rename-team-error {
  margin: 8px 0 0;
}

.team-name {
  font-size: 15px;
  color: var(--color-accent);
}

.team-you {
  font-weight: normal;
}

.add-team-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.connection-section-heading {
  display: block;
  margin-bottom: 4px;
  font-size: 15px;
}

.transfer-control-btn {
  margin-top: 12px;
}

.teams-limit-notice {
  margin-top: 12px;
}

.remove-team-message {
  margin-bottom: 16px;
}

.remove-team-error {
  margin: -8px 0 16px;
}

.modal-actions {
  display: block;
  font-size: 0;
}

.modal-actions > :deep(*) {
  display: inline-block;
  vertical-align: middle;
  font-size: 16px;
  margin-right: 8px;
}

.modal-actions > :deep(*:last-child) {
  margin-right: 0;
}

.rename-team-btn,
.remove-team-btn {
  box-shadow: none;
  padding: 6px;
  height: 32px;
  color: #1a1a2e;
}

.rename-team-btn {
  background: #e5e7eb;
}

.rename-team-btn:not(:disabled):hover {
  background: #d1d5db;
  color: #1a1a2e;
}

.remove-team-btn {
  background: #fec31b;
}

.remove-team-btn:not(:disabled):hover {
  background: #eeb50f;
  color: #1a1a2e;
}

.rename-team-btn :deep(.btn__icon),
.remove-team-btn :deep(.btn__icon) {
  width: 18px;
  height: 18px;
}
</style>
