import { api } from './api';

export type PublicReview = {
  id: string;
  message: string;
  telegramName: string;
  teamName: string | null;
  teamLogoUrl: string | null;
  createdAt: string;
};

export type MyReview = {
  id: string;
  message: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export function fetchPublishedReviews() {
  return api<{ reviews: PublicReview[] }>('/reviews');
}

export function fetchMyReview() {
  return api<{ review: MyReview | null }>('/auth/reviews/mine');
}

export function submitReview(message: string) {
  return api<{ review: MyReview }>('/auth/reviews', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}
