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
  displayCount: number;
  tourTitle?: string;
  questionPrompt?: string;
  hint?: string;
  correctAnswer?: string;
  explanation?: string;
  /** Командные слоты — ссылки активны до конца игры */
  teamSlots: TeamSlot[];
  pausedBy?: string;
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
