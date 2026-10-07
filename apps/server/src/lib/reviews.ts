import type { Player } from '@prisma/client';

const MAX_REVIEW_HTML_LENGTH = 8000;

/** Max new reviews a player may create per calendar month (Europe/Minsk). */
export const REVIEWS_PER_MONTH_LIMIT = 2;

const MINSK_TZ = 'Europe/Minsk';

export function telegramAuthorLabel(player: Pick<Player, 'username' | 'firstName' | 'lastName'>) {
  if (player.username) return `@${player.username}`;
  const parts = [player.firstName, player.lastName].filter(Boolean);
  return parts.length ? parts.join(' ') : 'Игрок';
}

export function normalizeReviewMessage(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const message = raw.trim();
  if (!message || message === '<p></p>') return null;
  if (message.length > MAX_REVIEW_HTML_LENGTH) {
    return message.slice(0, MAX_REVIEW_HTML_LENGTH);
  }
  return message;
}

export function plainTextFromReviewHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Start of the current calendar month in Europe/Minsk (as a Date). */
export function startOfCurrentMonthMinsk(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MINSK_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  if (!year || !month) {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
  // Minsk is UTC+3 year-round (no DST)
  return new Date(`${year}-${month}-01T00:00:00+03:00`);
}

export function reviewsRemainingThisMonth(createdThisMonth: number): number {
  return Math.max(0, REVIEWS_PER_MONTH_LIMIT - createdThisMonth);
}
