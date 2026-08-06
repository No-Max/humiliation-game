export type RoomStatus = 'WAITING' | 'PLAYING' | 'PAUSED' | 'FINISHED';

export type ClientRole = 'team' | 'display';

export type QuestionPhase =
  | 'TOUR_INTRO'
  | 'QUESTION'
  | 'FIRST_ROUND'
  | 'HINT'
  | 'STEAL_ROUND'
  | 'CORRECT'
  | 'REVEAL'
  | 'FINISHED';

export interface TeamState {
  id: string;
  name: string;
  logoUrl?: string;
  score: number;
  connected: boolean;
  passed: boolean;
  attempted: boolean;
}

export interface RoomState {
  roomCode: string;
  seriesId: string;
  seriesTitle: string;
  status: RoomStatus;
  phase: QuestionPhase;
  teams: TeamState[];
  teamOrder: string[];
  currentTeamIndex: number;
  activeTeamId?: string;
  currentTourIndex: number;
  currentQuestionIndex: number;
  questionValue: 2 | 3;
  valueReduced: boolean;
  hintShown: boolean;
  /** Подсказки, уже показанные в текущем вопросе (по одной на круг) */
  hints?: string[];
  /** Сколько подсказок всего настроено для вопроса */
  hintsTotal?: number;
  displayCount: number;
  tourTitle?: string;
  questionPrompt?: string;
  correctAnswer?: string;
  /** Командные слоты — ссылки активны до конца игры */
  teamSlots: TeamSlot[];
  pausedBy?: string;
  /** Лимит времени на ответ (сек), для текущего хода */
  timeLimitSec?: number;
  /** Unix ms — дедлайн ответа активной команды */
  answerDeadlineAt?: number;
  /** Сообщение о результате последнего хода (неверно, таймаут) */
  turnNotice?: string;
}

export interface TeamSlot {
  teamId: string;
  name: string;
}

export interface CreateRoomRequest {
  seriesId: string;
  teamName: string;
  logoUrl?: string;
}

export interface JoinRoomRequest {
  roomCode: string;
  teamName: string;
  logoUrl?: string;
}
