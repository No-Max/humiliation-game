import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { RoomState } from '@humiliation-game/shared';
import { teamsSortedByScore } from '@humiliation-game/shared';
import {
  connectSocket,
  disableAutoRejoin,
  joinRoom,
  leaveRoom,
  onRoomState,
  onSocketConnectionChange,
  setAutoRejoin,
} from '../lib/api';
import { syncFromRoomState } from '../lib/gameStorage';
import {
  clearTeamSlot,
  rememberTeamSlot,
  resolveTeamId,
} from '../lib/teamSession';

export function usePlayRoom() {
  const route = useRoute();
  const router = useRouter();
  const state = ref<RoomState | null>(null);
  const answer = ref('');
  const message = ref('');
  const teamId = ref('');
  const teamName = ref('');
  const socketConnected = ref(true);
  const joined = ref(false);
  const showConnectionModal = ref(false);
  const showExitModal = ref(false);
  let cleanup: (() => void) | undefined;
  let connectionCleanup: (() => void) | undefined;

  const code = computed(() => route.params.code as string);
  const routeTeamId = computed(() => {
    const fromRoute = route.params.teamId as string | undefined;
    return fromRoute ?? (route.query.team as string | undefined);
  });

  const linksActive = computed(() => state.value?.status !== 'FINISHED');
  const isPaused = computed(() => state.value?.status === 'PAUSED');
  const isMyTurn = computed(
    () =>
      !isPaused.value &&
      state.value?.activeTeamId &&
      state.value.activeTeamId === teamId.value,
  );
  const myTeam = computed(() => state.value?.teams.find((t) => t.id === teamId.value));
  const isChoiceQuestion = computed(() => state.value?.answerType === 'CHOICE');
  const showTourResults = computed(
    () => state.value?.phase === 'TOUR_INTRO' && (state.value.currentTourIndex ?? 0) > 0,
  );
  const tourResultsTeams = computed(() =>
    state.value ? teamsSortedByScore(state.value.teams) : [],
  );
  const canSubmit = computed(() => answer.value.trim().length > 0);
  const isActiveQuestion = computed(
    () =>
      state.value?.phase === 'QUESTION' || state.value?.phase === 'STEAL_ROUND',
  );
  const offlineActiveTeam = computed(() => {
    if (!state.value?.activeTeamId) return null;
    const team = state.value.teams.find((t) => t.id === state.value!.activeTeamId);
    return team && !team.connected ? team : null;
  });

  function doJoin() {
    if (!teamId.value || !linksActive.value) return;

    joinRoom(
      { roomCode: code.value, role: 'team', teamId: teamId.value },
      (result) => {
        if (!result.ok) {
          message.value = result.error ?? 'Не удалось подключиться';
          joined.value = false;
          return;
        }
        joined.value = true;
        message.value = '';
        if (result.teamId) teamId.value = result.teamId;
        if (result.teamName) {
          teamName.value = result.teamName;
          rememberTeamSlot(
            code.value,
            teamId.value,
            result.teamName,
            state.value?.seriesTitle ?? 'Игра',
            state.value?.status === 'PAUSED' ? 'PAUSED' : 'PLAYING',
          );
        }
      },
    );
  }

  onMounted(() => {
    teamId.value = resolveTeamId(code.value, routeTeamId.value) ?? '';
    connectSocket();

    cleanup = onRoomState((s) => {
      state.value = s;
      if (teamId.value) {
        const name =
          teamName.value ||
          s.teams.find((t) => t.id === teamId.value)?.name ||
          'Команда';
        teamName.value = name;
        syncFromRoomState(code.value, teamId.value, name, s);
      } else if (s.status === 'FINISHED') {
        clearTeamSlot(code.value);
      }
    });

    connectionCleanup = onSocketConnectionChange((connected) => {
      socketConnected.value = connected;
    });

    setAutoRejoin(() =>
      teamId.value && linksActive.value
        ? { roomCode: code.value, role: 'team', teamId: teamId.value }
        : null,
    );

    if (teamId.value) {
      doJoin();
    }
  });

  watch(
    () => [state.value?.currentQuestionIndex, state.value?.currentTourIndex, state.value?.phase],
    () => {
      answer.value = '';
    },
  );

  watch(routeTeamId, (id) => {
    if (id && id !== teamId.value) {
      teamId.value = id;
      doJoin();
    }
  });

  onUnmounted(() => {
    cleanup?.();
    connectionCleanup?.();
  });

  function startTour() {
    connectSocket().emit('startTour', (result) => {
      if (!result.ok) message.value = result.error ?? 'Ошибка';
    });
  }

  function submitChoice(choice: string) {
    answer.value = choice;
    submit();
  }

  function submit() {
    if (!canSubmit.value) return;
    connectSocket().emit('submitAnswer', answer.value, (result) => {
      if (!result.ok) {
        message.value = result.error ?? 'Ошибка';
        return;
      }
      message.value = '';
      answer.value = '';
    });
  }

  function pass() {
    connectSocket().emit('pass', (result) => {
      if (!result.ok) message.value = result.error ?? 'Ошибка';
    });
  }

  function nextQuestion() {
    connectSocket().emit('nextQuestion', (result) => {
      if (!result.ok) message.value = result.error ?? 'Ошибка';
    });
  }

  function reconnect() {
    message.value = '';
    doJoin();
  }

  function onTeamRenamed(name: string) {
    rememberTeamSlot(
      code.value,
      teamId.value,
      name,
      state.value?.seriesTitle ?? 'Игра',
      state.value?.status === 'PAUSED' ? 'PAUSED' : 'PLAYING',
    );
  }

  function openConnection() {
    showConnectionModal.value = true;
  }

  function closeConnection() {
    showConnectionModal.value = false;
  }

  function pauseGame() {
    connectSocket().emit('pauseGame', (result) => {
      if (!result.ok) message.value = result.error ?? 'Ошибка';
    });
  }

  function resumeGame() {
    connectSocket().emit('resumeGame', (result) => {
      if (!result.ok) message.value = result.error ?? 'Ошибка';
    });
  }

  function openExit() {
    showExitModal.value = true;
  }

  function closeExit() {
    showExitModal.value = false;
  }

  function confirmExit() {
    const socket = connectSocket();

    const navigateAway = () => {
      disableAutoRejoin();
      joined.value = false;
      socket.disconnect();
      router.push('/series');
    };

    if (state.value?.status === 'PLAYING') {
      socket.emit('pauseGame', () => {
        leaveRoom(() => navigateAway());
      });
    } else {
      leaveRoom(() => navigateAway());
    }
  }

  return {
    state,
    answer,
    message,
    teamId,
    teamName,
    socketConnected,
    joined,
    showConnectionModal,
    showExitModal,
    code,
    linksActive,
    isPaused,
    isMyTurn,
    myTeam,
    isChoiceQuestion,
    showTourResults,
    tourResultsTeams,
    canSubmit,
    isActiveQuestion,
    offlineActiveTeam,
    startTour,
    submitChoice,
    submit,
    pass,
    nextQuestion,
    reconnect,
    onTeamRenamed,
    openConnection,
    closeConnection,
    pauseGame,
    resumeGame,
    openExit,
    closeExit,
    confirmExit,
  };
}
