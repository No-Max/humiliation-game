import type {
  AnswerMediaItem,
  AnswerMediaType,
  AnswerType,
  QuestionContentType,
  QuestionPhase,
  RoomState,
  TeamState,
} from '@humiliation-game/shared';
import type { GameTeam, Question, Series, Tour } from '@prisma/client';

type SeriesWithContent = Series & {
  tours: (Tour & { questions: Question[] })[];
};

const ANSWER_MEDIA_TYPES = new Set<AnswerMediaType>(['IMAGE', 'AUDIO', 'VIDEO']);

function parseAnswerMedia(value: unknown): AnswerMediaItem[] {
  if (!Array.isArray(value)) return [];
  const items: AnswerMediaItem[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const url = typeof (entry as { url?: unknown }).url === 'string'
      ? (entry as { url: string }).url.trim()
      : '';
    const type = (entry as { type?: unknown }).type;
    if (!url || typeof type !== 'string' || !ANSWER_MEDIA_TYPES.has(type as AnswerMediaType)) {
      continue;
    }
    items.push({ url, type: type as AnswerMediaType });
  }
  return items;
}

interface InMemoryQuestionState {
  phase: QuestionPhase;
  teamOrder: string[];
  currentTeamIndex: number;
  turnIndex: number;
  questionValue: number;
  valueReduced: boolean;
  hintsShownCount: number;
  firstRoundComplete: boolean;
  passedTeamIds: Set<string>;
  attemptedTeamIds: Set<string>;
  currentTourIndex: number;
  currentQuestionIndex: number;
}

export class GameEngine {
  private series: SeriesWithContent;
  private teams: Map<string, GameTeam & { connected: boolean }>;
  private state: InMemoryQuestionState;
  private paused = false;
  private pausedByTeamId?: string;
  private turnTimer: ReturnType<typeof setTimeout> | null = null;
  private answerDeadlineAt: number | null = null;
  private turnRemainingMs: number | null = null;
  private turnNotice?: string;
  private onStateChange?: () => void;
  displayCount = 0;

  constructor(
    public roomCode: string,
    series: SeriesWithContent,
    teams: GameTeam[],
  ) {
    this.series = series;
    this.teams = new Map(
      teams.map((t) => [t.id, { ...t, connected: false }]),
    );

    const teamOrder = shuffle([...teams.map((t) => t.id)]);
    this.state = {
      phase: 'TOUR_INTRO',
      teamOrder,
      currentTeamIndex: 0,
      turnIndex: 0,
      questionValue: 3,
      valueReduced: false,
      hintsShownCount: 0,
      firstRoundComplete: false,
      passedTeamIds: new Set(),
      attemptedTeamIds: new Set(),
      currentTourIndex: 0,
      currentQuestionIndex: 0,
    };
  }

  setOnStateChange(cb: () => void) {
    this.onStateChange = cb;
  }

  setTeamConnected(teamId: string, connected: boolean) {
    const team = this.teams.get(teamId);
    if (team) team.connected = connected;
  }

  addTeam(team: GameTeam) {
    this.teams.set(team.id, { ...team, connected: false });
    this.state.teamOrder.push(team.id);
  }

  renameTeam(
    teamId: string,
    name: string,
  ): { ok: boolean; error?: string; teamName?: string } {
    if (this.isGameFinished()) {
      return { ok: false, error: 'Игра уже завершена' };
    }

    const trimmed = name.trim();
    if (!trimmed) {
      return { ok: false, error: 'Введите название команды' };
    }

    const team = this.teams.get(teamId);
    if (!team) {
      return { ok: false, error: 'Команда не найдена' };
    }

    if (team.name.toLowerCase() === trimmed.toLowerCase()) {
      return { ok: true, teamName: trimmed };
    }

    const duplicate = [...this.teams.values()].some(
      (t) => t.id !== teamId && t.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      return { ok: false, error: 'Команда с таким названием уже есть' };
    }

    team.name = trimmed;
    return { ok: true, teamName: trimmed };
  }

  isGameFinished(): boolean {
    return this.state.phase === 'FINISHED';
  }

  isPaused(): boolean {
    return this.paused;
  }

  pause(teamId: string): { ok: boolean; error?: string } {
    if (this.isGameFinished()) {
      return { ok: false, error: 'Игра уже завершена' };
    }
    this.paused = true;
    this.pausedByTeamId = teamId;
    this.pauseTurnTimer();
    return { ok: true };
  }

  resume(): { ok: boolean; error?: string } {
    if (this.isGameFinished()) {
      return { ok: false, error: 'Игра уже завершена' };
    }
    if (!this.paused) {
      return { ok: false, error: 'Игра не на паузе' };
    }
    this.paused = false;
    this.pausedByTeamId = undefined;
    this.resumeTurnTimer();
    return { ok: true };
  }

  getPublicState(): RoomState {
    const question = this.getCurrentQuestion();
    const tour = this.series.tours[this.state.currentTourIndex];
    const showAnswer = this.state.phase === 'REVEAL' || this.state.phase === 'CORRECT';

    const status = this.state.phase === 'FINISHED'
      ? 'FINISHED'
      : this.paused
        ? 'PAUSED'
        : 'PLAYING';

    const timerActive = this.shouldRunTimer();
    const tourStarted = this.state.phase !== 'TOUR_INTRO';
    const answerMedia = showAnswer ? parseAnswerMedia(question?.answerMedia) : [];

    return {
      roomCode: this.roomCode,
      seriesId: this.series.id,
      seriesTitle: this.series.title,
      status,
      phase: this.state.phase,
      teams: this.buildTeamStates(),
      teamOrder: this.state.teamOrder,
      currentTeamIndex: this.state.currentTeamIndex,
      activeTeamId: this.getActiveTeamId(),
      currentTourIndex: this.state.currentTourIndex,
      currentQuestionIndex: this.state.currentQuestionIndex,
      questionValue: this.state.questionValue,
      valueReduced: this.state.valueReduced,
      hintShown: tourStarted && this.state.hintsShownCount > 0,
      hints: tourStarted ? this.getRevealedHints(question) : undefined,
      hintsTotal: tourStarted && question ? this.getQuestionHints(question).length : undefined,
      displayCount: this.displayCount,
      tourTitle: tour?.title,
      tourQuestionCount:
        this.state.phase === 'TOUR_INTRO' && tour
          ? this.getEffectiveQuestionCount(tour)
          : undefined,
      limitQuestionsToTeamCount:
        this.state.phase === 'TOUR_INTRO' && tour?.limitQuestionsToTeamCount
          ? true
          : undefined,
      questionPrompt: tourStarted ? question?.prompt ?? undefined : undefined,
      questionContentType: tourStarted
        ? (question?.contentType as QuestionContentType | undefined)
        : undefined,
      answerType: tourStarted
        ? (question?.answerType as AnswerType | undefined)
        : undefined,
      choices: tourStarted && question?.answerType === 'CHOICE' && question.choices.length
        ? question.choices
        : undefined,
      mediaUrls: tourStarted && question?.mediaUrls?.length
        ? question.mediaUrls
        : !tourStarted && tour?.mediaUrls?.length
          ? tour.mediaUrls
          : undefined,
      tourRules: !tourStarted ? tour?.rules ?? undefined : undefined,
      correctAnswer: showAnswer ? question?.correctAnswer : undefined,
      answerMedia: answerMedia.length ? answerMedia : undefined,
      teamSlots: this.state.teamOrder.map((id) => {
        const team = this.teams.get(id)!;
        return { teamId: id, name: team.name };
      }),
      pausedBy: this.pausedByTeamId
        ? this.teams.get(this.pausedByTeamId)?.name
        : undefined,
      timeLimitSec: timerActive ? this.getTimeLimitSec() : undefined,
      answerDeadlineAt: timerActive ? this.answerDeadlineAt ?? undefined : undefined,
      turnNotice: tourStarted ? this.turnNotice : undefined,
    };
  }

  private ensurePlaying(): { ok: boolean; error?: string } {
    if (this.isGameFinished()) {
      return { ok: false, error: 'Игра уже завершена' };
    }
    if (this.paused) {
      return { ok: false, error: 'Игра на паузе' };
    }
    return { ok: true };
  }

  startTour(): { ok: boolean; error?: string } {
    const guard = this.ensurePlaying();
    if (!guard.ok) return guard;
    if (this.state.phase !== 'TOUR_INTRO') {
      return { ok: false, error: 'Not in tour intro phase' };
    }
    this.resetQuestionState();
    this.state.phase = 'QUESTION';
    this.refreshTurnTimer();
    return { ok: true };
  }

  submitAnswer(teamId: string, answer: string): {
    ok: boolean;
    error?: string;
    correct?: boolean;
    questionValueReduced?: boolean;
  } {
    const guard = this.ensurePlaying();
    if (!guard.ok) return guard;
    if (!this.canAct(teamId)) {
      return { ok: false, error: 'Not your turn' };
    }

    const question = this.getCurrentQuestion();
    if (!question) return { ok: false, error: 'No active question' };

    this.turnNotice = undefined;
    this.ensureStealRoundStarted();

    this.state.attemptedTeamIds.add(teamId);
    const correct = checkAnswer(answer, question);

    if (correct) {
      this.clearTurnTimer();
      this.turnNotice = undefined;
      this.awardPoints(teamId);
      this.state.phase = 'CORRECT';
      return { ok: true, correct: true };
    }

    const questionValueReduced = !this.state.valueReduced;
    if (!this.state.valueReduced) {
      this.state.questionValue = Math.max(1, this.state.questionValue - 1);
      this.state.valueReduced = true;
    }

    this.setWrongTurnNotice(questionValueReduced, false);
    this.advanceToNextTeam(teamId);
    this.afterWrongAnswer(question);
    this.refreshTurnTimer();
    return { ok: true, correct: false, questionValueReduced };
  }

  pass(teamId: string): { ok: boolean; error?: string } {
    const guard = this.ensurePlaying();
    if (!guard.ok) return guard;
    if (!this.canAct(teamId)) {
      return { ok: false, error: 'Not your turn' };
    }
    return this.passInternal(teamId);
  }

  nextQuestion(): { ok: boolean; error?: string } {
    const guard = this.ensurePlaying();
    if (!guard.ok) return guard;
    if (this.state.phase !== 'CORRECT' && this.state.phase !== 'REVEAL') {
      return { ok: false, error: 'Cannot advance now' };
    }

    const tour = this.series.tours[this.state.currentTourIndex];
    if (!tour) return { ok: false, error: 'No tour' };

    const questionLimit = this.getEffectiveQuestionCount(tour);
    if (this.state.currentQuestionIndex + 1 < questionLimit) {
      this.state.currentQuestionIndex += 1;
      this.state.currentTeamIndex =
        (this.state.currentTeamIndex + 1) % this.state.teamOrder.length;
      this.resetQuestionState();
      this.state.phase = 'QUESTION';
      this.refreshTurnTimer();
      return { ok: true };
    }

    if (this.state.currentTourIndex + 1 < this.series.tours.length) {
      this.clearTurnTimer();
      this.state.currentTourIndex += 1;
      this.state.currentQuestionIndex = 0;
      this.state.currentTeamIndex =
        (this.state.currentTeamIndex + 1) % this.state.teamOrder.length;
      this.state.phase = 'TOUR_INTRO';
      return { ok: true };
    }

    this.clearTurnTimer();
    this.state.phase = 'FINISHED';
    return { ok: true };
  }

  private passInternal(teamId: string): { ok: boolean; error?: string } {
    this.ensureStealRoundStarted();

    this.state.passedTeamIds.add(teamId);
    this.state.attemptedTeamIds.add(teamId);
    this.advanceToNextTeam(teamId);

    const question = this.getCurrentQuestion();
    if (question) {
      this.maybeCompleteFirstRound(question);
      if (this.state.firstRoundComplete) {
        this.maybeCompleteStealCycle(question);
      }
    }

    if (this.allTeamsPassed()) {
      this.clearTurnTimer();
      this.state.phase = 'REVEAL';
    } else if (this.getActiveTeamId()) {
      this.state.phase = this.state.firstRoundComplete ? 'STEAL_ROUND' : 'QUESTION';
      this.refreshTurnTimer();
    } else {
      this.clearTurnTimer();
    }

    return { ok: true };
  }

  private handleTurnTimeout() {
    if (this.paused || this.isGameFinished()) return;

    const activeId = this.getActiveTeamId();
    if (!activeId) return;

    this.timeoutTurn(activeId);
    this.onStateChange?.();
  }

  private timeoutTurn(teamId: string) {
    const question = this.getCurrentQuestion();
    if (!question) return;

    this.ensureStealRoundStarted();

    this.state.attemptedTeamIds.add(teamId);

    const questionValueReduced = !this.state.valueReduced;
    if (!this.state.valueReduced) {
      this.state.questionValue = Math.max(1, this.state.questionValue - 1);
      this.state.valueReduced = true;
    }

    this.setWrongTurnNotice(questionValueReduced, true);
    this.advanceToNextTeam(teamId);
    this.afterWrongAnswer(question);

    if (this.getActiveTeamId()) {
      this.state.phase = this.state.firstRoundComplete ? 'STEAL_ROUND' : 'QUESTION';
      this.refreshTurnTimer();
    } else {
      this.clearTurnTimer();
    }
  }

  private setWrongTurnNotice(questionValueReduced: boolean, timedOut: boolean) {
    const prefix = timedOut ? 'Время вышло!' : 'Неверно!';
    this.turnNotice = questionValueReduced
      ? `${prefix} −1 балл за вопрос`
      : `${prefix} Попробуйте ещё`;
  }

  private getTimeLimitSec(): number {
    const question = this.getCurrentQuestion();
    const tour = this.series.tours[this.state.currentTourIndex];
    return question?.timeLimitSec ?? tour?.defaultTimeLimitSec ?? 60;
  }

  private shouldRunTimer(): boolean {
    if (this.paused) return false;
    if (!this.getActiveTeamId()) return false;
    return this.state.phase === 'QUESTION' || this.state.phase === 'STEAL_ROUND';
  }

  private clearTurnTimer() {
    if (this.turnTimer) clearTimeout(this.turnTimer);
    this.turnTimer = null;
    this.answerDeadlineAt = null;
    this.turnRemainingMs = null;
  }

  private pauseTurnTimer() {
    if (!this.turnTimer || !this.answerDeadlineAt) {
      this.clearTurnTimer();
      return;
    }
    this.turnRemainingMs = Math.max(0, this.answerDeadlineAt - Date.now());
    if (this.turnTimer) clearTimeout(this.turnTimer);
    this.turnTimer = null;
    this.answerDeadlineAt = null;
  }

  private resumeTurnTimer() {
    if (this.turnRemainingMs != null && this.shouldRunTimer()) {
      const remaining = this.turnRemainingMs;
      this.turnRemainingMs = null;
      this.answerDeadlineAt = Date.now() + remaining;
      this.turnTimer = setTimeout(() => this.handleTurnTimeout(), remaining);
      return;
    }
    this.refreshTurnTimer();
  }

  private refreshTurnTimer() {
    this.clearTurnTimer();
    if (!this.shouldRunTimer()) return;

    const limitMs = this.getTimeLimitSec() * 1000;
    this.answerDeadlineAt = Date.now() + limitMs;
    this.turnTimer = setTimeout(() => this.handleTurnTimeout(), limitMs);
  }

  private canAct(teamId: string): boolean {
    const activeId = this.getActiveTeamId();
    return !!activeId && teamId === activeId;
  }

  private ensureStealRoundStarted() {
    if (this.state.phase === 'HINT') {
      this.beginStealRound();
    }
  }

  private getQuestionHints(question: Question): string[] {
    return question.hints ?? [];
  }

  private getRevealedHints(question: Question | undefined): string[] | undefined {
    if (!question || this.state.hintsShownCount <= 0) return undefined;
    const hints = this.getQuestionHints(question);
    const revealed = hints.slice(0, this.state.hintsShownCount);
    return revealed.length ? revealed : undefined;
  }

  private resetStealCycleAttempts() {
    for (const id of this.state.teamOrder) {
      if (!this.state.passedTeamIds.has(id)) {
        this.state.attemptedTeamIds.delete(id);
      }
    }
    this.state.turnIndex = 0;
  }

  private resetQuestionState() {
    const tour = this.series.tours[this.state.currentTourIndex];
    const question = this.getCurrentQuestion();
    const points = question?.points ?? tour?.defaultPoints ?? 3;
    this.state.questionValue = Math.max(1, points);
    this.state.valueReduced = false;
    this.state.hintsShownCount = 0;
    this.state.firstRoundComplete = false;
    this.state.turnIndex = 0;
    this.turnNotice = undefined;
    this.state.passedTeamIds = new Set();
    this.state.attemptedTeamIds = new Set();
  }

  private getTeamCount(): number {
    return this.teams.size;
  }

  private getEffectiveQuestionCount(tour: Tour & { questions: Question[] }): number {
    if (!tour.limitQuestionsToTeamCount) {
      return tour.questions.length;
    }
    return Math.min(tour.questions.length, this.getTeamCount());
  }

  private getCurrentQuestion(): Question | undefined {
    const tour = this.series.tours[this.state.currentTourIndex];
    return tour?.questions[this.state.currentQuestionIndex];
  }

  private getActiveTeamId(): string | undefined {
    if (this.paused) return undefined;

    if (
      this.state.phase === 'TOUR_INTRO' ||
      this.state.phase === 'FINISHED' ||
      this.state.phase === 'CORRECT' ||
      this.state.phase === 'REVEAL' ||
      this.state.phase === 'HINT'
    ) {
      return undefined;
    }

    const candidates = this.getActiveTeamIds();
    if (!candidates.length) return undefined;

    const idx = this.state.turnIndex % candidates.length;
    return candidates[idx];
  }

  private getRotatedTeamOrder(): string[] {
    const { teamOrder, currentTeamIndex } = this.state;
    if (!teamOrder.length) return [];

    const start = ((currentTeamIndex % teamOrder.length) + teamOrder.length) % teamOrder.length;
    return [...teamOrder.slice(start), ...teamOrder.slice(0, start)];
  }

  private getActiveTeamIds(): string[] {
    return this.getRotatedTeamOrder().filter((id) => !this.state.passedTeamIds.has(id));
  }

  private advanceToNextTeam(fromTeamId?: string) {
    const previousActiveId = fromTeamId ?? this.getActiveTeamId();
    if (!previousActiveId) {
      this.state.turnIndex += 1;
      return;
    }

    const rotated = this.getRotatedTeamOrder();
    const startIdx = rotated.indexOf(previousActiveId);
    if (startIdx === -1) {
      this.state.turnIndex += 1;
      return;
    }

    let nextActiveId: string | undefined;
    for (let step = 1; step <= rotated.length; step += 1) {
      const candidateId = rotated[(startIdx + step) % rotated.length];
      if (this.state.passedTeamIds.has(candidateId)) continue;
      nextActiveId = candidateId;
      break;
    }

    if (nextActiveId) {
      const activeIds = this.getActiveTeamIds();
      const nextIdx = activeIds.indexOf(nextActiveId);
      if (nextIdx !== -1) {
        this.state.turnIndex = nextIdx;
      }
    } else {
      this.state.turnIndex += 1;
    }

    if (previousActiveId !== this.getActiveTeamId()) {
      this.turnNotice = undefined;
    }
  }

  private afterWrongAnswer(question: Question) {
    if (!this.state.firstRoundComplete) {
      this.maybeCompleteFirstRound(question);
      return;
    }

    this.maybeCompleteStealCycle(question);
  }

  private maybeCompleteFirstRound(question: Question) {
    if (this.state.firstRoundComplete) return;

    const activeTeams = this.getActiveTeamIds();
    const allAttempted = activeTeams.every((id) =>
      this.state.attemptedTeamIds.has(id),
    );

    if (!allAttempted) return;

    this.state.firstRoundComplete = true;
    this.revealNextHint(question);
    this.beginStealRound();
  }

  private maybeCompleteStealCycle(question: Question) {
    if (this.state.phase !== 'STEAL_ROUND') return;

    const activeTeams = this.getActiveTeamIds();
    if (activeTeams.length === 0) return;

    const allAttempted = activeTeams.every((id) =>
      this.state.attemptedTeamIds.has(id),
    );
    if (!allAttempted) return;

    this.revealNextHint(question);
    this.resetStealCycleAttempts();
    this.refreshTurnTimer();
  }

  private revealNextHint(question: Question) {
    const hints = this.getQuestionHints(question);
    if (hints.length > 0 && this.state.hintsShownCount < hints.length) {
      this.state.hintsShownCount += 1;
    }
  }

  private beginStealRound() {
    this.resetStealCycleAttempts();
    this.state.phase = 'STEAL_ROUND';
    this.refreshTurnTimer();
  }

  private allTeamsPassed(): boolean {
    return this.state.teamOrder.every((id) => this.state.passedTeamIds.has(id));
  }

  private awardPoints(teamId: string) {
    const team = this.teams.get(teamId);
    if (team) team.score += this.state.questionValue;
  }

  private buildTeamStates(): TeamState[] {
    return this.state.teamOrder.map((id) => {
      const team = this.teams.get(id)!;
      return {
        id: team.id,
        name: team.name,
        logoUrl: team.logoUrl ?? undefined,
        score: team.score,
        connected: team.connected,
        passed: this.state.passedTeamIds.has(id),
        attempted: this.state.attemptedTeamIds.has(id),
      };
    });
  }
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function checkAnswer(answer: string, question: Question): boolean {
  const normalized = normalize(answer);

  if (question.answerType === 'CHOICE') {
    const choices = question.choices ?? [];
    if (!choices.some((choice) => normalize(choice) === normalized)) {
      return false;
    }
    return normalize(question.correctAnswer) === normalized;
  }

  const acceptable = [question.correctAnswer, ...(question.acceptableAnswers ?? [])].map(normalize);
  return acceptable.includes(normalized);
}
