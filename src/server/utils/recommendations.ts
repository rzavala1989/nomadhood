import { REVIEW_DIMENSIONS } from '@/server/constants/dimensions';

export interface UserProfile {
  dimensionVector: number[]; // avg per dimension across liked reviews
  walkScoreRange: { min: number; max: number } | null;
  rentRange: { min: number; max: number } | null;
  crimeTolerance: number | null; // max violent crime rate from liked neighborhoods
  preferredStates: string[];
}

/**
 * Cosine similarity between two numeric vectors of equal length.
 * Returns 0 if either vector is all zeros.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Build a user preference profile from their highly-rated reviews.
 * Caller is expected to fill in rentRange and crimeTolerance after DB lookups.
 */
export function buildUserProfile(likedReviews: any[]): UserProfile {
  // Build dimension vector: average rating per dimension across liked reviews
  const dimSums: Record<string, { total: number; count: number }> = {};
  for (const dim of REVIEW_DIMENSIONS) {
    dimSums[dim] = { total: 0, count: 0 };
  }

  for (const review of likedReviews) {
    for (const d of review.dimensions) {
      if (dimSums[d.dimension]) {
        dimSums[d.dimension].total += d.rating;
        dimSums[d.dimension].count += 1;
      }
    }
  }

  const dimensionVector = REVIEW_DIMENSIONS.map((dim) =>
    dimSums[dim].count > 0 ? dimSums[dim].total / dimSums[dim].count : 0,
  );

  // Walk score range from liked neighborhoods
  const walkScores: number[] = [];
  for (const r of likedReviews) {
    const ws = r.neighborhood.walkScoreCache?.walkScore;
    if (ws != null) walkScores.push(ws);
  }

  const walkScoreRange = walkScores.length > 0
    ? { min: Math.min(...walkScores), max: Math.max(...walkScores) }
    : null;

  // Preferred states
  const stateCounts: Record<string, number> = {};
  for (const r of likedReviews) {
    const state = r.neighborhood.state;
    stateCounts[state] = (stateCounts[state] || 0) + 1;
  }
  const preferredStates = Object.entries(stateCounts)
    .filter(([, count]) => count >= 1)
    .map(([state]) => state);

  return {
    dimensionVector,
    walkScoreRange,
    rentRange: null,
    crimeTolerance: null,
    preferredStates,
  };
}

/**
 * Build dimension vector for a neighborhood from its reviews.
 * Returns a zero vector when no review dimension data is available.
 */
export function buildNeighborhoodDimensionVector(neighborhood: any): number[] {
  const reviews = neighborhood.reviews || [];
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

  return REVIEW_DIMENSIONS.map((dim) =>
    dimSums[dim].count > 0 ? dimSums[dim].total / dimSums[dim].count : 0,
  );
}