export interface MediaLibraryItem {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export const MEDIA_PAGE_SIZE = 20;
export const MEDIA_PICKER_PAGE_SIZE = 12;

export interface MediaLibraryPage {
  items: MediaLibraryItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type MediaKind = 'image' | 'audio' | 'video';

export function mediaKind(mimeType: string): MediaKind | null {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  return null;
}

export function mediaKindLabel(kind: MediaKind): string {
  if (kind === 'image') return 'Картинка';
  if (kind === 'audio') return 'Аудио';
  return 'Видео';
}

export function matchesMediaFilter(item: MediaLibraryItem, filter: MediaKind | 'all'): boolean {
  if (filter === 'all') return true;
  return mediaKind(item.mimeType) === filter;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export function formatMediaDate(value: string): string {
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function sortMediaNewestFirst(items: MediaLibraryItem[]): MediaLibraryItem[] {
  return [...items].sort((a, b) => {
    const byDate = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (byDate !== 0) return byDate;
    return b.id.localeCompare(a.id);
  });
}

export function mediaListQuery(
  page: number,
  kind: MediaKind | 'all',
  limit = MEDIA_PAGE_SIZE,
  search = '',
): string {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    kind,
  });
  const query = search.trim();
  if (query) params.set('search', query);
  return `/media?${params.toString()}`;
}
