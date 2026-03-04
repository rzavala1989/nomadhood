import { prisma } from '@/server/prisma';

export async function getMaxCounts() {
  const [maxReviewResult, maxFavoriteResult] = await Promise.all([
    prisma.review.groupBy({
      by: ['neighborhoodId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    }),
    prisma.favorite.groupBy({
      by: ['neighborhoodId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    }),
  ]);
  return {
    maxReviews: maxReviewResult[0]?._count.id ?? 1,
    maxFavorites: maxFavoriteResult[0]?._count.id ?? 1,
  };
}
