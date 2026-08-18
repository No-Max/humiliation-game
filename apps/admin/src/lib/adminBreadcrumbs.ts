import { ref, watch, type Ref } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { adminApi } from './api';
import { tourQuestionsRoute } from './tourNavigation';

export interface BreadcrumbItem {
  label: string;
  to?: RouteLocationRaw;
}

export interface SeriesMeta {
  id: string;
  number: number;
  title: string;
}

export function crumbSeriesList(): BreadcrumbItem {
  return { label: 'Выпуски', to: '/series' };
}

export function crumbToursList(): BreadcrumbItem {
  return { label: 'Туры', to: '/tours' };
}

export function crumbSeries(series: SeriesMeta): BreadcrumbItem {
  return {
    label: `Выпуск ${series.number}: ${series.title}`,
    to: `/series/${series.id}`,
  };
}

export function crumbTourQuestions(
  tourId: string,
  tourTitle: string,
  seriesId: string | null,
): BreadcrumbItem {
  return {
    label: `Задания: ${tourTitle}`,
    to: tourQuestionsRoute(tourId, seriesId),
  };
}

export function useSeriesBreadcrumb(seriesId: Ref<string | null>) {
  const seriesMeta = ref<SeriesMeta | null>(null);

  watch(
    seriesId,
    async (id) => {
      if (!id) {
        seriesMeta.value = null;
        return;
      }
      try {
        const data = await adminApi<SeriesMeta>(`/series/${id}`);
        seriesMeta.value = {
          id: data.id,
          number: data.number,
          title: data.title,
        };
      } catch {
        seriesMeta.value = null;
      }
    },
    { immediate: true },
  );

  return { seriesMeta };
}

export function buildTourContextCrumbs(
  seriesId: string | null,
  seriesMeta: SeriesMeta | null,
): BreadcrumbItem[] {
  if (!seriesId) return [crumbToursList()];
  if (seriesMeta) return [crumbSeriesList(), crumbSeries(seriesMeta)];
  return [crumbSeriesList(), { label: '…' }];
}
