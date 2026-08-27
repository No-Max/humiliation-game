import type { AnswerMediaItem, AnswerType, QuestionChoice, QuestionContentType } from './content.js';

/** Максимум команд в одной игровой комнате */
export const MAX_ROOM_TEAMS = 4;

export type RoomStatus = 'WAITING' | 'PLAYING' | 'PAUSED' | 'FINISHED';

export type ClientRole = 'team' | 'display';

export type QuestionPhase =
  | 'TOUR_RESULTS'
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
  /** В туре играют не больше вопросов, чем команд (по одному на команду) */
  limitQuestionsToTeamCount?: boolean;
  /** Правила тура (HTML) на экране TOUR_INTRO */
  tourRules?: string;
  questionPrompt?: string;
  questionContentType?: QuestionContentType;
  answerType?: AnswerType;
  choices?: QuestionChoice[];
  mediaUrls?: string[];
  correctAnswer?: string;
  answerMedia?: AnswerMediaItem[];
  /** Название команды, которой начислили баллы (фаза CORRECT) */
  scoringTeamName?: string;
  /** Id команды, которой начислили баллы (фаза CORRECT) */
  scoringTeamId?: string;
  /** Id команды, которая может нажать «Следующий вопрос» (2+ команд, фазы CORRECT/REVEAL) */
  nextQuestionTeamId?: string;
  /** Командные слоты — ссылки активны до конца игры */
  teamSlots: TeamSlot[];
  pausedBy?: string;
  /** Лимит времени на ответ (сек), для текущего хода */
  timeLimitSec?: number;
  /** Unix ms — дедлайн ответа активной команды */
  answerDeadlineAt?: number;
  /** Сообщение о результате последнего хода (неверно, таймаут) */
  turnNotice?: string;
  /** Результаты по всем вопросам (экран FINISHED) */
  gameResults?: GameQuestionResult[];
}

export interface TeamSlot {
  teamId: string;
  name: string;
}

/** Итог одного вопроса (экран FINISHED) */
export interface GameQuestionResult {
  tourIndex: number;
  questionIndex: number;
  correctAnswer: string;
  points: number;
  /** Название тура */
  tourTitle?: string;
  /** Команда, которой начислили баллы; если никто не угадал — не задано */
  scoringTeamId?: string;
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
  return state.phase === 'FINISHED' || state.phase === 'TOUR_RESULTS';
}

/** Индекс только что завершённого тура (на экране TOUR_RESULTS). */
export function completedTourIndex(
  state: Pick<RoomState, 'phase' | 'currentTourIndex'>,
): number | null {
  if (state.phase !== 'TOUR_RESULTS' || state.currentTourIndex <= 0) return null;
  return state.currentTourIndex - 1;
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

export const TOUR_ONE_QUESTION_PER_TEAM_LABEL = 'по 1 вопросу на команду';

export function formatTourQuestionMeta(
  count: number,
  limitQuestionsToTeamCount?: boolean,
): string {
  if (limitQuestionsToTeamCount) return TOUR_ONE_QUESTION_PER_TEAM_LABEL;
  return formatQuestionCount(count);
}

export function formatHintsCount(count: number): string {
  const n = Math.abs(count);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} подсказок`;
  if (mod10 === 1) return `${n} подсказка`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} подсказки`;
  return `${n} подсказок`;
}

export function formatHintsProgress(revealed: number, total: number): string {
  if (revealed > 0) return `${revealed} из ${total}`;
  return formatHintsCount(total);
}

export function formatPoints(count: number): string {
  const n = Math.abs(count);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} баллов`;
  if (mod10 === 1) return `${n} балл`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} балла`;
  return `${n} баллов`;
}

export function formatTourLabel(tourIndex: number, tourTitle?: string): string {
  const number = tourIndex + 1;
  if (!tourTitle) return String(number);
  return `Тур №${number}. «${tourTitle}»`;
}

export function playScreenTitle(
  state: Pick<RoomState, 'seriesTitle' | 'tourTitle' | 'currentTourIndex' | 'phase' | 'status'>,
): string {
  const completed = completedTourIndex(state);
  if (completed != null) {
    return `Итоги: ${formatTourLabel(completed, state.tourTitle)}`;
  }
  if (state.tourTitle && state.phase !== 'FINISHED' && state.status !== 'WAITING' && state.phase === 'TOUR_INTRO') {
    return formatTourLabel(state.currentTourIndex, state.tourTitle);
  }
  return state.seriesTitle ?? 'Игра';
}
