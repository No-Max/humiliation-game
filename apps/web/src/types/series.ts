import type { AnswerType, QuestionChoice } from '@humiliation-game/shared';

export interface PublicSeriesSampleQuestion {
  id: string;
  prompt?: string | null;
  mediaUrls: string[];
  audioUrl?: string | null;
  answerType: AnswerType;
  choices: QuestionChoice[];
}

export interface PublicSeriesTour {
  id: string;
  title: string;
  limitQuestionsToTeamCount?: boolean;
  _count: { questions: number };
  sampleQuestion?: PublicSeriesSampleQuestion | null;
}

export interface PublicSeries {
  id: string;
  title: string;
  number: number;
  description?: string;
  publishedAt?: string | null;
  tours: PublicSeriesTour[];
}
