import type { Player } from '@prisma/client';

const MAX_REVIEW_HTML_LENGTH = 8000;

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
