import type { NeighborhoodExternalData } from '@/server/services/types';

export function calculateAvgRating(reviews: { rating: number }[]): number | null {
  if (reviews.length === 0) return null;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

/**
 * Community-only Nomad Score (used on list pages where external data isn't loaded).
 * Weights: avgRating 50%, reviewCount 30%, favoriteCount 20%.
 */
export function calculateNomadScore(
  avgRating: number | null,
  reviewCount: number,
  favoriteCount: number,
  maxReviews: number,
  maxFavorites: number,
): number {
  return Math.round(
    ((avgRating ?? 0) / 5) * 50 +
      (reviewCount / maxReviews) * 30 +
      (favoriteCount / maxFavorites) * 20,
  );
}

/**
 * Enhanced Nomad Score that blends community data with external API data.
 * When external data is present, weights shift to include objective metrics.
 *
 * With external data:
 *   Avg Rating     20%
 *   Review Volume  12%
 *   Favorites       8%
 *   Walkability    15%  (walk + transit + bike composite)
 *   Transit/Bike   10%  (transit and bike scores)
 *   Safety         15%  (inverse crime rate)
 *   Affordability  20%  (inverse median rent, scaled)
 *
 * Without external data: falls back to community-only formula.
 */
export function calculateEnhancedNomadScore(
  avgRating: number | null,
  reviewCount: number,
  favoriteCount: number,
  maxReviews: number,
  maxFavorites: number,
  externalData?: NeighborhoodExternalData,
): number {
  // Fall back to community-only if no external data at all
  if (
    !externalData ||
    (!externalData.walkScore && !externalData.rentData && !externalData.crimeData)
  ) {
    return calculateNomadScore(avgRating, reviewCount, favoriteCount, maxReviews, maxFavorites);
  }

  let score = 0;

  // Community: avg rating (20%)
  score += ((avgRating ?? 0) / 5) * 20;

  // Community: review volume (12%)
  const reviewNorm = maxReviews > 0 ? reviewCount / maxReviews : 0;
  score += reviewNorm * 12;

  // Community: favorites (8%)
  const favNorm = maxFavorites > 0 ? favoriteCount / maxFavorites : 0;
  score += favNorm * 8;

  // Walkability (15%): walk score 0-100
  if (externalData.walkScore?.walkScore != null) {
    score += (externalData.walkScore.walkScore / 100) * 15;
  } else {
    // Redistribute to community
    score += ((avgRating ?? 0) / 5) * 15;
  }

  // Transit/Bike (10%): average of transit and bike, 0-100
  const transit = externalData.walkScore?.transitScore;
  const bike = externalData.walkScore?.bikeScore;
  if (transit != null || bike != null) {
    const vals = [transit, bike].filter((v): v is number => v != null);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    score += (avg / 100) * 10;
  } else {
    score += ((avgRating ?? 0) / 5) * 10;
  }

  // Safety (15%): inverse violent crime rate
  // National avg ~380/100k. Lower is better. Cap at 1000 for normalization.
  if (externalData.crimeData?.violentCrimeRate != null) {
    const capped = Math.min(externalData.crimeData.violentCrimeRate, 1000);
    const safetyNorm = 1 - capped / 1000;
    score += safetyNorm * 15;
  } else {
    score += ((avgRating ?? 0) / 5) * 15;
  }

  // Affordability (20%): inverse median rent
  // Scale: $500 = perfect, $5000 = 0. Lower rent = higher score.
  if (externalData.rentData?.medianRent != null) {
    const rent = externalData.rentData.medianRent;
    const clamped = Math.max(500, Math.min(rent, 5000));
    const affordNorm = 1 - (clamped - 500) / 4500;
    score += affordNorm * 20;
  } else {
    score += ((avgRating ?? 0) / 5) * 20;
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}
