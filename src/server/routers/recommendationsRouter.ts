import { z } from 'zod';
import {
  router,
  protectedProcedure,
} from '@/server/trpc';
import { prisma } from '@/server/prisma';
import {
  cosineSimilarity,
  buildUserProfile,
  buildNeighborhoodDimensionVector,
} from '@/server/utils/recommendations';

export const recommendationsRouter = router({
  getForUser: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(10),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;
      const userId = ctx.user.id;

      // Check cache first (24h TTL)
      const cached = await prisma.recommendationCache.findMany({
        where: {
          userId,
          computedAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        orderBy: { matchScore: 'desc' },
        take: limit,
        include: {
          neighborhood: {
            include: {
              _count: { select: { reviews: true, favorites: true } },
              reviews: { select: { rating: true } },
            },
          },
        },
      });

      if (cached.length > 0) {
        return {
          recommendations: cached.map((c) => ({
            neighborhoodId: c.neighborhoodId,
            neighborhood: c.neighborhood,
            matchScore: c.matchScore,
            matchReasons: c.matchReasons as string[],
          })),
          fromCache: true,
        };
      }

      // Fetch user's highly-rated reviews (4+)
      const likedReviews = await prisma.review.findMany({
        where: { userId, rating: { gte: 4 } },
        include: {
          dimensions: true,
          neighborhood: {
            include: {
              walkScoreCache: true,
            },
          },
        },
      });

      // Fallback: if fewer than 2 liked reviews, return globally top-rated unreviewed
      if (likedReviews.length < 2) {
        return getFallbackRecommendations(userId, limit);
      }

      // Build user profile
      const profile = buildUserProfile(likedReviews);

      // Fetch all neighborhoods user has NOT reviewed
      const userReviewedIds = await prisma.review.findMany({
        where: { userId },
        select: { neighborhoodId: true },
      });
      const reviewedSet = new Set(userReviewedIds.map((r) => r.neighborhoodId));

      const candidates = await prisma.neighborhood.findMany({
        where: { id: { notIn: [...reviewedSet] } },
        include: {
          _count: { select: { reviews: true, favorites: true } },
          reviews: {
            select: { rating: true },
            include: { dimensions: true },
          } as any,
          walkScoreCache: true,
        },
      });

      // Fetch rent data for candidate zips
      const candidateZips = [...new Set(candidates.map((c) => c.zip))];
      const rentDataMap = new Map<string, number>();
      if (candidateZips.length > 0) {
        const rentRows = await prisma.rentcastCache.findMany({
          where: { zip: { in: candidateZips } },
          select: { zip: true, medianRent: true },
        });
        for (const r of rentRows) {
          if (r.medianRent != null) rentDataMap.set(r.zip, r.medianRent);
        }
      }

      // Fetch crime data for candidate cities
      const candidateCityStates = [...new Set(candidates.map((c) => `${c.city}|${c.state}`))];
      const crimeMap = new Map<string, number>();
      if (candidateCityStates.length > 0) {
        const crimeRows = await prisma.crimeDataCache.findMany({
          where: {
            OR: candidateCityStates.map((cs) => {
              const [city, state] = cs.split('|');
              return { city, state };
            }),
          },
          select: { city: true, state: true, violentCrimeRate: true },
        });
        for (const c of crimeRows) {
          if (c.violentCrimeRate != null) {
            crimeMap.set(`${c.city}|${c.state}`, c.violentCrimeRate);
          }
        }
      }

      // Fetch rent data for user's liked neighborhoods
      const likedZips = [...new Set(likedReviews.map((r) => r.neighborhood.zip))];
      const likedRentRows = await prisma.rentcastCache.findMany({
        where: { zip: { in: likedZips } },
        select: { zip: true, medianRent: true },
      });
      const likedRentMap = new Map<string, number>();
      for (const r of likedRentRows) {
        if (r.medianRent != null) likedRentMap.set(r.zip, r.medianRent);
      }

      // Build rent range from liked neighborhoods
      const likedRents = likedReviews
        .map((r) => likedRentMap.get(r.neighborhood.zip))
        .filter((v): v is number => v != null);
      if (likedRents.length > 0) {
        const margin = 500;
        profile.rentRange = {
          min: Math.max(0, Math.min(...likedRents) - margin),
          max: Math.max(...likedRents) + margin,
        };
      }

      // Fetch crime data for user's liked neighborhoods
      const likedCrimeRows = await prisma.crimeDataCache.findMany({
        where: {
          OR: likedReviews.map((r) => ({
            city: r.neighborhood.city,
            state: r.neighborhood.state,
          })),
        },
        select: { city: true, state: true, violentCrimeRate: true },
      });
      const maxCrime = likedCrimeRows
        .map((c) => c.violentCrimeRate)
        .filter((v): v is number => v != null);
      if (maxCrime.length > 0) {
        profile.crimeTolerance = Math.max(...maxCrime) * 1.2; // 20% tolerance margin
      }

      // Score candidates
      const scored = candidates.map((candidate) => {
        let score = 0;
        const reasons: string[] = [];

        // 1. Dimension profile similarity (30%)
        const candidateDimVector = buildNeighborhoodDimensionVector(candidate as any);
        if (candidateDimVector.some((v) => v > 0) && profile.dimensionVector.some((v) => v > 0)) {
          const sim = cosineSimilarity(profile.dimensionVector, candidateDimVector);
          score += sim * 0.30;
          if (sim > 0.7) reasons.push('Similar dimension ratings to neighborhoods you loved');
        }

        // 2. Walk Score proximity (25%)
        const ws = (candidate as any).walkScoreCache;
        if (ws?.walkScore != null && profile.walkScoreRange) {
          const { min, max } = profile.walkScoreRange;
          const range = max - min || 1;
          const dist = Math.max(0, ws.walkScore < min ? min - ws.walkScore : ws.walkScore > max ? ws.walkScore - max : 0);
          const proximity = Math.max(0, 1 - dist / range);
          score += proximity * 0.25;
          if (proximity > 0.7) reasons.push(`Walk Score (${ws.walkScore}) matches your preference`);
        } else {
          score += 0.125; // neutral when no data
        }

        // 3. Rent proximity (25%)
        const candidateRent = rentDataMap.get(candidate.zip);
        if (candidateRent != null && profile.rentRange) {
          const { min, max } = profile.rentRange;
          const range = max - min || 1;
          const dist = Math.max(0, candidateRent < min ? min - candidateRent : candidateRent > max ? candidateRent - max : 0);
          const proximity = Math.max(0, 1 - dist / range);
          score += proximity * 0.25;
          if (proximity > 0.7) reasons.push(`Rent ($${Math.round(candidateRent)}/mo) fits your budget`);
        } else {
          score += 0.125;
        }

        // 4. Safety match (10%)
        const candidateCrime = crimeMap.get(`${candidate.city}|${candidate.state}`);
        if (candidateCrime != null && profile.crimeTolerance != null) {
          const safetyScore = candidateCrime <= profile.crimeTolerance ? 1 : Math.max(0, 1 - (candidateCrime - profile.crimeTolerance) / profile.crimeTolerance);
          score += safetyScore * 0.10;
          if (safetyScore > 0.8) reasons.push('Safety level matches your comfort zone');
        } else {
          score += 0.05;
        }

        // 5. Geographic preference (10%)
        if (profile.preferredStates.includes(candidate.state)) {
          score += 0.10;
          reasons.push(`You've enjoyed other neighborhoods in ${candidate.state}`);
        }

        if (reasons.length === 0) {
          reasons.push('Matches your overall profile');
        }

        return {
          neighborhoodId: candidate.id,
          neighborhood: candidate,
          matchScore: Math.round(score * 1000) / 1000,
          matchReasons: reasons,
        };
      });

      // Sort by score descending, take top N
      scored.sort((a, b) => b.matchScore - a.matchScore);
      const topN = scored.slice(0, limit);

      // Cache results
      if (topN.length > 0) {
        await prisma.recommendationCache.deleteMany({ where: { userId } });
        await prisma.recommendationCache.createMany({
          data: topN.map((r) => ({
            userId,
            neighborhoodId: r.neighborhoodId,
            matchScore: r.matchScore,
            matchReasons: r.matchReasons,
          })),
        });
      }

      return {
        recommendations: topN,
        fromCache: false,
      };
    }),
});

async function getFallbackRecommendations(userId: string, limit: number) {
  const userReviewedIds = await prisma.review.findMany({
    where: { userId },
    select: { neighborhoodId: true },
  });
  const reviewedSet = new Set(userReviewedIds.map((r) => r.neighborhoodId));

  const topNeighborhoods = await prisma.neighborhood.findMany({
    where: { id: { notIn: [...reviewedSet] } },
    include: {
      _count: { select: { reviews: true, favorites: true } },
      reviews: { select: { rating: true } },
    },
    take: limit * 2,
  });

  // Sort by average rating descending
  const withRatings = topNeighborhoods
    .map((n) => {
      const avgRating = n.reviews.length > 0
        ? n.reviews.reduce((s, r) => s + r.rating, 0) / n.reviews.length
        : 0;
      return { ...n, avgRating };
    })
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, limit);

  return {
    recommendations: withRatings.map((n) => ({
      neighborhoodId: n.id,
      neighborhood: n,
      matchScore: n.avgRating / 5,
      matchReasons: ['Popular among nomads'],
    })),
    fromCache: false,
  };
}
