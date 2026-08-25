<script setup lang="ts">
import { ref, watch } from 'vue';
import type { TeamState } from '@humiliation-game/shared';
import { formatPoints } from '@humiliation-game/shared';
import Button from '../Button.vue';
import ModalShell from '../ModalShell.vue';

const props = defineProps<{
  open: boolean;
  teams: TeamState[];
  questionValue: number;
  scoringTeamId?: string;
}>();

const emit = defineEmits<{
  close: [];
  save: [scoringTeamId: string | null];
}>();

const selectedTeamId = ref('');

watch(
  () => props.open,
  (open) => {
    if (open) {
      selectedTeamId.value = props.scoringTeamId ?? '';
    }
  },
);

function save() {
  emit('save', selectedTeamId.value || null);
}
</script>

<template>
  <ModalShell v-if="open" title-id="adjust-result-title" @close="emit('close')">
    <template #header>
      <h2 id="adjust-result-title">Изменить результат</h2>
      <Button variant="close" aria-label="Закрыть" @click="emit('close')" />
    </template>

    <p class="adjust-result-hint">
      Выберите, какой команде засчитать ответ. Будет начислено {{ formatPoints(questionValue) }}.
    </p>

    <fieldset class="adjust-result-options">
      <legend class="adjust-result-legend">Результат вопроса</legend>

      <label class="adjust-result-option">
        <input v-model="selectedTeamId" type="radio" name="scoring-team" value="" />
        <span>Никто не угадал</span>
      </label>

      <label
        v-for="team in teams"
        :key="team.id"
        class="adjust-result-option"
      >
        <input
          v-model="selectedTeamId"
          type="radio"
          name="scoring-team"
          :value="team.id"
        />
        <span>{{ team.name }}</span>
      </label>
    </fieldset>

    <div class="modal-actions">
      <Button @click="save">Сохранить</Button>
      <Button variant="secondary" @click="emit('close')">Отмена</Button>
    </div>
  </ModalShell>
</template>

<style scoped>
.adjust-result-hint {
  margin: 0 0 16px;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.4;
}

.adjust-result-options {
  margin: 0;
  padding: 0;
  border: none;
  display: grid;
  gap: 8px;
}

.adjust-result-legend {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: bold;
}

.adjust-result-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
}

.adjust-result-option:has(input:checked) {
  border-color: #4f46e5;
  background: #eef2ff;
}

.adjust-result-option input {
  margin: 0;
}

.modal-actions {
  display: block;
  font-size: 0;
  margin-top: 16px;
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
</style>
