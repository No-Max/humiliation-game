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

export type MyReviewStatus = {
  review: MyReview | null;
  monthlyLimit: number;
  createdThisMonth: number;
  remainingThisMonth: number;
  canCreateNew: boolean;
};

export function fetchPublishedReviews() {
  return api<{ reviews: PublicReview[] }>('/reviews');
}

export function fetchMyReview() {
  return api<MyReviewStatus>('/auth/reviews/mine');
}

export function submitReview(message: string) {
  return api<{ review: MyReview }>('/auth/reviews', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}
