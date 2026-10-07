export const COMMENT_COOLDOWN_MS = 5 * 60 * 1000;
export const MAX_COMMENT_LENGTH = 1000;

export function normalizeCommentMessage(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const message = raw.replace(/\s+/g, ' ').trim();
  if (!message) return null;
  if (message.length > MAX_COMMENT_LENGTH) {
    return message.slice(0, MAX_COMMENT_LENGTH);
  }
  return message;
}

export function commentCooldownRemainingMs(lastCreatedAt: Date | null | undefined, now = Date.now()): number {
  if (!lastCreatedAt) return 0;
  const elapsed = now - lastCreatedAt.getTime();
  if (elapsed >= COMMENT_COOLDOWN_MS) return 0;
  return COMMENT_COOLDOWN_MS - elapsed;
}
