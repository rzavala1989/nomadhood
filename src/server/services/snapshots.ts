import { Prisma } from '@prisma/client';
import { prisma } from '@/server/prisma';
import { calculateAvgRating, calculateNomadScore } from '@/server/utils/scores';
import { getMaxCounts } from '@/server/utils/queries';
import { REVIEW_DIMENSIONS } from '@/server/constants/dimensions';

/**
 * Create a snapshot for every neighborhood. Idempotent per day (upserts).
 * Also cleans up snapshots older than 52 weeks.
 */
export async function createSnapshotAll() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [neighborhoods, { maxReviews, maxFavorites }] = await Promise.all([
    prisma.neighborhood.findMany({
      include: {
        _count: { select: { reviews: true, favorites: true } },
        reviews: {
          select: { rating: true, id: true },
        },
      },
    }),
    getMaxCounts(),
  ]);

  // Fetch all dimensions in one query
  const allDimensions = await prisma.reviewDimension.findMany({
    select: { reviewId: true, dimension: true, rating: true },
  });
  const dimsByReview = new Map<string, { dimension: string; rating: number }[]>();
  for (const d of allDimensions) {
    if (!dimsByReview.has(d.reviewId)) dimsByReview.set(d.reviewId, []);
    dimsByReview.get(d.reviewId)!.push(d);
  }

  let written = 0;

  for (const n of neighborhoods) {
    const avgRating = calculateAvgRating(n.reviews);
    const nomadScore = calculateNomadScore(
      avgRating ?? 0,
      n._count.reviews,
      n._count.favorites,
      maxReviews,
      maxFavorites,
    );

    // Compute dimension averages
    const dimSums: Record<string, { total: number; count: number }> = {};
    for (const dim of REVIEW_DIMENSIONS) {
      dimSums[dim] = { total: 0, count: 0 };
    }
    for (const review of n.reviews) {
      const dims = dimsByReview.get(review.id) || [];
      for (const d of dims) {
        if (dimSums[d.dimension]) {
          dimSums[d.dimension].total += d.rating;
          dimSums[d.dimension].count += 1;
        }
      }
    }
    const dimensionAvgs: Record<string, number> = {};
    for (const dim of REVIEW_DIMENSIONS) {
      if (dimSums[dim].count > 0) {
        dimensionAvgs[dim] = Math.round((dimSums[dim].total / dimSums[dim].count) * 100) / 100;
      }
    }

    await prisma.neighborhoodSnapshot.upsert({
      where: {
        neighborhoodId_snapshotDate: {
          neighborhoodId: n.id,
          snapshotDate: today,
        },
      },
      update: {
        nomadScore,
        avgRating,
        reviewCount: n._count.reviews,
        favoriteCount: n._count.favorites,
        dimensionAvgs: Object.keys(dimensionAvgs).length > 0 ? dimensionAvgs : Prisma.JsonNull,
      },
      create: {
        neighborhoodId: n.id,
        snapshotDate: today,
        nomadScore,
        avgRating,
        reviewCount: n._count.reviews,
        favoriteCount: n._count.favorites,
        dimensionAvgs: Object.keys(dimensionAvgs).length > 0 ? dimensionAvgs : Prisma.JsonNull,
      },
    });
    written++;
  }

  // Data retention: delete snapshots older than 52 weeks
  const retentionCutoff = new Date();
  retentionCutoff.setDate(retentionCutoff.getDate() - 52 * 7);
  const deleted = await prisma.neighborhoodSnapshot.deleteMany({
    where: { snapshotDate: { lt: retentionCutoff } },
  });

  return {
    neighborhoodsProcessed: neighborhoods.length,
    snapshotsWritten: written,
    expiredDeleted: deleted.count,
  };
}
