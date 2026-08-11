import type { AnswerType, QuestionContentType } from './content.js';

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
  questionValue: number;
  valueReduced: boolean;
  hintShown: boolean;
  /** Подсказки, уже показанные в текущем вопросе (по одной на круг) */
  hints?: string[];
  /** Сколько подсказок всего настроено для вопроса */
  hintsTotal?: number;
  displayCount: number;
  tourTitle?: string;
  /** Число заданий в текущем туре (на экране TOUR_INTRO) */
  tourQuestionCount?: number;
  questionPrompt?: string;
  questionContentType?: QuestionContentType;
  answerType?: AnswerType;
  choices?: string[];
  mediaUrls?: string[];
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

/** Показывать суммарные баллы команд только между турами и в конце игры. */
export function shouldShowTeamScores(
  state: Pick<RoomState, 'phase' | 'currentTourIndex'>,
): boolean {
  return (
    state.phase === 'FINISHED'
    || (state.phase === 'TOUR_INTRO' && state.currentTourIndex > 0)
  );
}

export function teamsSortedByScore(teams: TeamState[]): TeamState[] {
  return [...teams].sort(
    (a, b) => b.score - a.score || a.name.localeCompare(b.name, 'ru'),
  );
}

export function formatQuestionCount(count: number): string {
  const n = Math.abs(count);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} вопросов`;
  if (mod10 === 1) return `${n} вопрос`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} вопроса`;
  return `${n} вопросов`;
}
