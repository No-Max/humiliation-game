import { api } from './api';

export type SeriesComment = {
  id: string;
  message: string;
  telegramName: string;
  teamName: string | null;
  teamLogoUrl: string | null;
  createdAt: string;
};

export type SeriesCommentsResponse = {
  comments: SeriesComment[];
  canComment: boolean;
  retryAfterSeconds: number;
};

export function fetchSeriesComments(seriesId: string) {
  return api<SeriesCommentsResponse>(`/series/${seriesId}/comments`);
}

export function submitSeriesComment(seriesId: string, message: string) {
  return api<{ comment: SeriesComment }>(`/auth/series/${seriesId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}
