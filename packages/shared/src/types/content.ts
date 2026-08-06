export type QuestionContentType =
  | 'IMAGE'
  | 'TEXT'
  | 'QUOTE'
  | 'LYRICS'
  | 'EMOJI'
  | 'IMAGE_TEXT';

export type AnswerType = 'CHOICE' | 'TEXT';

export type SeriesStatus = 'DRAFT' | 'PUBLISHED';

export interface Series {
  id: string;
  title: string;
  number: number;
  description?: string;
  coverUrl?: string;
  status: SeriesStatus;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tour {
  id: string;
  seriesId: string;
  title: string;
  rules?: string;
  defaultPoints: 2 | 3;
  defaultTimeLimitSec: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  tourId: string;
  sortOrder: number;
  contentType: QuestionContentType;
  prompt?: string;
  mediaUrls: string[];
  answerType: AnswerType;
  choices?: string[];
  correctAnswer: string;
  acceptableAnswers?: string[];
  hints?: string[];
  timeLimitSec?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SeriesDetail extends Series {
  tours: (Tour & { questions: Question[] })[];
}
