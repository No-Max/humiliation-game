/** Из QR или ссылки извлекает 6-значный код комнаты. */
export function parseRoomCodeFromScan(text: string): string | null {
  const trimmed = text.trim();
  if (/^\d{6}$/.test(trimmed)) return trimmed;

  try {
    const url = trimmed.startsWith('http')
      ? new URL(trimmed)
      : new URL(trimmed, window.location.origin);
    const fromPath = url.pathname.match(/\/(?:display|join|team|play)\/(\d{6})/);
    if (fromPath) return fromPath[1];
  } catch {
    /* not a URL */
  }

  const fallback = trimmed.match(/(?:^|\/)(\d{6})(?:\/|$|\?|#)/);
  return fallback ? fallback[1] : null;
}
