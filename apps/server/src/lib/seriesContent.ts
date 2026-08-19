import type { Question, Series, Tour } from '@prisma/client';
import { prisma } from './prisma.js';

export type SeriesWithTours = Series & {
  tours: (Tour & { questions: Question[]; sortOrder: number })[];
};

const seriesToursInclude = {
  seriesTours: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      tour: {
        include: {
          questions: { orderBy: { sortOrder: 'asc' as const } },
        },
      },
    },
  },
};

export function mapSeriesWithTours(
  series: Series & {
    seriesTours: Array<{
      sortOrder: number;
      tour: Tour & { questions: Question[] };
    }>;
  },
): SeriesWithTours {
  const { seriesTours, ...rest } = series;
  return {
    ...rest,
    tours: seriesTours.map(({ sortOrder, tour }) => ({
      ...tour,
      sortOrder,
    })),
  };
}

export async function loadSeriesWithTours(
  where: { id: string } | { number: number },
): Promise<SeriesWithTours | null> {
  const series = await prisma.series.findUnique({
    where,
    include: seriesToursInclude,
  });
  if (!series) return null;
  return mapSeriesWithTours(series);
}

export async function loadPublishedSeriesWithTours(
  seriesId: string,
): Promise<SeriesWithTours | null> {
  const series = await prisma.series.findFirst({
    where: { id: seriesId, status: 'PUBLISHED' },
    include: seriesToursInclude,
  });
  if (!series) return null;
  return mapSeriesWithTours(series);
}

export async function cloneTourForSeries(source: Tour): Promise<Tour> {
  return prisma.tour.create({
    data: {
      title: source.title,
      rules: source.rules,
      mediaUrls: source.mediaUrls,
      defaultPoints: source.defaultPoints,
      defaultTimeLimitSec: source.defaultTimeLimitSec,
      limitQuestionsToTeamCount: source.limitQuestionsToTeamCount,
    },
  });
}
