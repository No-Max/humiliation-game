import type { RouteLocationRaw, RouteLocationNormalizedLoaded } from 'vue-router';

export function getSeriesIdFromRoute(route: RouteLocationNormalizedLoaded): string | null {
  const id = route.query.seriesId;
  return typeof id === 'string' ? id : null;
}

export function toursBackRoute(seriesId: string | null): RouteLocationRaw {
  return seriesId ? `/series/${seriesId}` : '/tours';
}

export function toursBackLabel(seriesId: string | null): string {
  return seriesId ? '← К выпуску' : '← К турам';
}

export function tourSettingsNewRoute(seriesId?: string | null): RouteLocationRaw {
  return seriesId ? { path: '/tours/new', query: { seriesId } } : '/tours/new';
}

export function tourSettingsRoute(tourId: string, seriesId?: string | null): RouteLocationRaw {
  return seriesId
    ? { path: `/tours/${tourId}/edit`, query: { seriesId } }
    : `/tours/${tourId}/edit`;
}

export function tourQuestionsRoute(tourId: string, seriesId: string | null): RouteLocationRaw {
  return seriesId
    ? { path: `/tours/${tourId}/questions`, query: { seriesId } }
    : `/tours/${tourId}/questions`;
}

export function tourQuestionNewRoute(tourId: string, seriesId: string | null): RouteLocationRaw {
  return seriesId
    ? { path: `/tours/${tourId}/questions/new`, query: { seriesId } }
    : `/tours/${tourId}/questions/new`;
}

export function tourQuestionEditRoute(
  tourId: string,
  questionId: string,
  seriesId: string | null,
): RouteLocationRaw {
  return seriesId
    ? { path: `/tours/${tourId}/questions/${questionId}`, query: { seriesId } }
    : `/tours/${tourId}/questions/${questionId}`;
}
