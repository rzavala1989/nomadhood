import { z } from 'zod';
import {
  router,
  publicProcedure,
  adminProcedure,
} from '@/server/trpc';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/prisma';
import { calculateAvgRating, calculateNomadScore } from '@/server/utils/scores';
import { getMaxCounts } from '@/server/utils/queries';
import { REVIEW_DIMENSIONS } from '@/server/constants/dimensions';

const PERIOD_WEEKS: Record<string, number> = {
  '4w': 4,
  '12w': 12,
  '26w': 26,
  '52w': 52,
};

export const trendsRouter = router({
  getForNeighborhood: publicProcedure
    .input(
      z.object({
        neighborhoodId: z.string().uuid(),
        period: z.enum(['4w', '12w', '26w', '52w']).default('12w'),
      }),
    )
    .query(async ({ input }) => {
      const weeks = PERIOD_WEEKS[input.period];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - weeks * 7);

      const snapshots = await prisma.neighborhoodSnapshot.findMany({
        where: {
          neighborhoodId: input.neighborhoodId,
          snapshotDate: { gte: startDate },
        },
        orderBy: { snapshotDate: 'asc' },
      });

      if (snapshots.length < 2) {
        return { snapshots, deltas: null };
      }

      const first = snapshots[0];
      const last = snapshots[snapshots.length - 1];
      const prev = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : first;

      return {
        snapshots,
        deltas: {
          periodStart: first.snapshotDate,
          periodEnd: last.snapshotDate,
          nomadScoreDelta: last.nomadScore - first.nomadScore,
          avgRatingDelta:
            last.avgRating != null && first.avgRating != null
              ? Math.round((last.avgRating - first.avgRating) * 100) / 100
              : null,
          reviewCountDelta: last.reviewCount - first.reviewCount,
          favoriteCountDelta: last.favoriteCount - first.favoriteCount,
          weekOverWeek: {
            nomadScoreDelta: last.nomadScore - prev.nomadScore,
            reviewCountDelta: last.reviewCount - prev.reviewCount,
          },
        },
      };
    }),

  getTrending: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(10),
        direction: z.enum(['up', 'down']).default('up'),
      }).optional(),
    )
    .query(async ({ input }) => {
      const limit = input?.limit ?? 10;
      const direction = input?.direction ?? 'up';

      const now = new Date();
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(now.getDate() - 28);

      // Get latest snapshot per neighborhood
      const latestSnapshots = await prisma.$queryRaw<
        { neighborhoodId: string; nomadScore: number; snapshotDate: Date }[]
      >`
        SELECT DISTINCT ON ("neighborhoodId")
          "neighborhoodId", "nomadScore", "snapshotDate"
        FROM "NeighborhoodSnapshot"
        ORDER BY "neighborhoodId", "snapshotDate" DESC
      `;

      // Get snapshot closest to 4 weeks ago per neighborhood
      const olderSnapshots = await prisma.$queryRaw<
        { neighborhoodId: string; nomadScore: number; snapshotDate: Date }[]
      >`
        SELECT DISTINCT ON ("neighborhoodId")
          "neighborhoodId", "nomadScore", "snapshotDate"
        FROM "NeighborhoodSnapshot"
        WHERE "snapshotDate" <= ${fourWeeksAgo}
        ORDER BY "neighborhoodId", "snapshotDate" DESC
      `;

      const olderMap = new Map(
        olderSnapshots.map((s) => [s.neighborhoodId, s.nomadScore]),
      );

      const deltas = latestSnapshots
        .filter((s) => olderMap.has(s.neighborhoodId))
        .map((s) => ({
          neighborhoodId: s.neighborhoodId,
          currentScore: s.nomadScore,
          delta: s.nomadScore - olderMap.get(s.neighborhoodId)!,
        }));

      deltas.sort((a, b) =>
        direction === 'up' ? b.delta - a.delta : a.delta - b.delta,
      );

      const topDeltas = deltas.slice(0, limit);

      if (topDeltas.length === 0) return [];

      const neighborhoods = await prisma.neighborhood.findMany({
        where: { id: { in: topDeltas.map((d) => d.neighborhoodId) } },
        select: { id: true, name: true, city: true, state: true },
      });

      const nMap = new Map(neighborhoods.map((n) => [n.id, n]));

      return topDeltas
        .map((d) => {
          const n = nMap.get(d.neighborhoodId);
          if (!n) return null;
          return {
            id: n.id,
            name: n.name,
            city: n.city,
            state: n.state,
            currentScore: d.currentScore,
            delta: d.delta,
          };
        })
        .filter(Boolean);
    }),

  createSnapshot: adminProcedure.mutation(async () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [neighborhoods, { maxReviews, maxFavorites }] = await Promise.all([
      prisma.neighborhood.findMany({
        include: {
          _count: { select: { reviews: true, favorites: true } },
          reviews: {
            select: { rating: true },
            include: { dimensions: true },
          } as any,
        },
      }),
      getMaxCounts(),
    ]);

    let created = 0;

    for (const n of neighborhoods) {
      const reviews = n.reviews as any[];
      const avgRating = calculateAvgRating(reviews);
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
      for (const review of reviews) {
        if (!review.dimensions) continue;
        for (const d of review.dimensions) {
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

      const result = await prisma.neighborhoodSnapshot.upsert({
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

      if (result) {
        // upsert doesn't distinguish create vs update easily, count total
        created++;
      }
    }

    // Data retention: delete snapshots older than 52 weeks
    const retentionCutoff = new Date();
    retentionCutoff.setDate(retentionCutoff.getDate() - 52 * 7);
    const deleted = await prisma.neighborhoodSnapshot.deleteMany({
      where: { snapshotDate: { lt: retentionCutoff } },
    });

    return {
      snapshotDate: today.toISOString().slice(0, 10),
      neighborhoodsProcessed: neighborhoods.length,
      snapshotsWritten: created,
      expiredDeleted: deleted.count,
    };
  }),
});
