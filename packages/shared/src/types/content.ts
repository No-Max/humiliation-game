export type QuestionContentType =
  | 'IMAGE'
  | 'TEXT'
  | 'QUOTE'
  | 'LYRICS'
  | 'EMOJI'
  | 'IMAGE_TEXT';

export type AnswerMediaType = 'IMAGE' | 'AUDIO' | 'VIDEO';

export interface AnswerMediaItem {
  url: string;
  type: AnswerMediaType;
}

export type AnswerType = 'CHOICE' | 'TEXT';

export type SeriesStatus = 'DRAFT' | 'PUBLISHED';

/** Вариант ответа для вопроса с типом CHOICE */
export interface QuestionChoice {
  text: string;
  imageUrl?: string;
}

export function parseQuestionChoices(value: unknown): QuestionChoice[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (typeof entry === 'string') {
      const text = entry.trim();
      return text ? [{ text }] : [];
    }
    if (!entry || typeof entry !== 'object') return [];

    const text = typeof (entry as { text?: unknown }).text === 'string'
      ? (entry as { text: string }).text.trim()
      : '';
    if (!text) return [];

    const imageUrlRaw = (entry as { imageUrl?: unknown }).imageUrl;
    const imageUrl = typeof imageUrlRaw === 'string' ? imageUrlRaw.trim() : '';

    return [{ text, imageUrl: imageUrl || undefined }];
  });
}

export function serializeQuestionChoices(choices: QuestionChoice[]): QuestionChoice[] {
  return choices
    .map((choice) => ({
      text: choice.text.trim(),
      imageUrl: choice.imageUrl?.trim() || undefined,
    }))
    .filter((choice) => choice.text);
}

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
  title: string;
  rules?: string;
  mediaUrls?: string[];
  defaultPoints: number;
  defaultTimeLimitSec: number;
  limitQuestionsToTeamCount?: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  tourId: string;
  seriesId: string;
  sortOrder: number;
  contentType: QuestionContentType;
  prompt?: string;
  mediaUrls: string[];
  answerType: AnswerType;
  choices?: QuestionChoice[];
  correctAnswer: string;
  acceptableAnswers?: string[];
  hints?: string[];
  points?: number;
  timeLimitSec?: number;
  answerMedia?: AnswerMediaItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SeriesDetail extends Series {
  tours: (Tour & { questions: Question[] })[];
}
