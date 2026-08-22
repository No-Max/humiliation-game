import type { RoomState } from './game.js';

export interface ServerToClientEvents {
  roomState: (state: RoomState) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  joinRoom: (payload: JoinRoomPayload, callback: (result: JoinRoomResult) => void) => void;
  startGame: (callback: (result: ActionResult) => void) => void;
  startTour: (callback: (result: ActionResult) => void) => void;
  continueToTourIntro: (callback: (result: ActionResult) => void) => void;
  submitAnswer: (answer: string, callback: (result: ActionResult) => void) => void;
  pass: (callback: (result: ActionResult) => void) => void;
  nextQuestion: (callback: (result: ActionResult) => void) => void;
  pauseGame: (callback: (result: ActionResult) => void) => void;
  resumeGame: (callback: (result: ActionResult) => void) => void;
  leaveRoom: (callback: (result: ActionResult) => void) => void;
  renameTeam: (name: string, callback: (result: ActionResult) => void) => void;
  /** Клиент: локальный таймер истёк — сервер сверит дедлайн и передаст ход */
  syncExpiredTurn: (callback: (result: ActionResult) => void) => void;
}

export type JoinRole = 'team' | 'display';

export interface JoinRoomPayload {
  roomCode: string;
  role: JoinRole;
  teamId?: string;
  teamName?: string;
  /** Переподключиться к существующей команде по названию */
  reconnectTeamName?: string;
}

export interface JoinRoomResult {
  ok: boolean;
  error?: string;
  teamId?: string;
  teamName?: string;
  reconnected?: boolean;
  teamSlotUrl?: string;
  displayUrl?: string;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
  correct?: boolean;
  questionValueReduced?: boolean;
  teamName?: string;
}

export const SOCKET_EVENTS = {
  ROOM_STATE: 'roomState',
  ERROR: 'error',
  JOIN_ROOM: 'joinRoom',
  START_GAME: 'startGame',
  START_TOUR: 'startTour',
  CONTINUE_TO_TOUR_INTRO: 'continueToTourIntro',
  SUBMIT_ANSWER: 'submitAnswer',
  PASS: 'pass',
  NEXT_QUESTION: 'nextQuestion',
  PAUSE_GAME: 'pauseGame',
  RESUME_GAME: 'resumeGame',
  LEAVE_ROOM: 'leaveRoom',
  RENAME_TEAM: 'renameTeam',
  SYNC_EXPIRED_TURN: 'syncExpiredTurn',
} as const;
