<script setup lang="ts">
import { useRouter } from 'vue-router';
import { statusLabel, type SavedGameSession } from '../lib/gameStorage';
import { getTeamSlotPath } from '../lib/teamSession';
import Button from './Button.vue';

defineProps<{
  sessions: SavedGameSession[];
}>();

const emit = defineEmits<{
  dismiss: [roomCode: string];
}>();

const router = useRouter();

function continueGame(session: SavedGameSession) {
  router.push(getTeamSlotPath(session.roomCode, session.teamId));
}
</script>

<template>
  <div class="unfinished-games">
    <div v-for="session in sessions" :key="session.roomCode" class="unfinished-item">
      <div class="unfinished-item-content">
        <span class="unfinished-series-title">{{ session.seriesTitle }}</span>
        <span class="unfinished-meta text-muted-sm">
          {{ session.teamName }} · {{ statusLabel(session.status) }}
        </span>
      </div>
      <div class="unfinished-actions">
        <Button @click="continueGame(session)" compact>Продолжить</Button>
        <Button variant="secondary" @click="emit('dismiss', session.roomCode)" compact>Убрать</Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.unfinished-games {
  display: block;
}

.unfinished-meta {
  display: inline-block;
}

.unfinished-series-title {
  display: inline-block;
  padding-right: 16px;
  font-weight: bold;
  width: 100%;
}

.unfinished-item {
  display: inline-block;
  padding: 12px 0;
  border-top: 1px solid #e5e7eb;
  width: 100%;
}

.unfinished-item:last-child {
  padding-bottom: 0;
}

.unfinished-item-content {
  display: inline-block;
  vertical-align: middle;
  width: calc(100% - 250px);
}

.unfinished-item::after {
  content: '';
  display: table;
  clear: both;
}

.unfinished-item:first-of-type {
  border-top: none;
  padding-top: 0;
}

.unfinished-actions {
  float: right;
  display: inline-block;
  vertical-align: middle;
  font-size: 0;
  position: relative;
  top: 12px;
}

.unfinished-actions > * {
  display: inline-block;
  margin-left: 8px;
}

.unfinished-actions > *:first-child {
  margin-left: 0;
}

@media (max-width: 500px) {
  .unfinished-item,
  .unfinished-item:last-child {
    position: relative;
    padding-bottom: 56px;
  }

  .unfinished-item-content {
    width: 100%;
  }

  .unfinished-actions {
    float: none;
    position: absolute;
    right: 0;
    bottom: 12px;
    top: auto;
  }
}
</style>
