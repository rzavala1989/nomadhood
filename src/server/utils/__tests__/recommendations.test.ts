import {
  cosineSimilarity,
  buildUserProfile,
  buildNeighborhoodDimensionVector,
} from '@/server/utils/recommendations';
import { REVIEW_DIMENSIONS } from '@/server/constants/dimensions';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 4);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 4);
  });

  it('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [-1, -2, -3])).toBeCloseTo(-1, 4);
  });

  it('returns 0 when first vector is all zeros', () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
  });

  it('returns 0 when second vector is all zeros', () => {
    expect(cosineSimilarity([1, 2, 3], [0, 0, 0])).toBe(0);
  });

  it('returns 0 when both vectors are zero', () => {
    expect(cosineSimilarity([0, 0], [0, 0])).toBe(0);
  });

  it('matches the known value for [1,2,3] vs [4,5,6]', () => {
    // dot=32, magA=sqrt(14), magB=sqrt(77), sim ≈ 0.9746318
    expect(cosineSimilarity([1, 2, 3], [4, 5, 6])).toBeCloseTo(0.9746, 4);
  });

  it('handles single-element vectors', () => {
    expect(cosineSimilarity([3], [5])).toBeCloseTo(1, 4);
    expect(cosineSimilarity([3], [-5])).toBeCloseTo(-1, 4);
  });

  it('handles negative values correctly', () => {
    expect(cosineSimilarity([-1, -2], [-1, -2])).toBeCloseTo(1, 4);
    expect(cosineSimilarity([-1, 2], [1, -2])).toBeCloseTo(-1, 4);
  });
});

function makeReview(overrides: {
  dimensions?: { dimension: string; rating: number }[];
  state?: string;
  walkScore?: number | null;
} = {}) {
  return {
    dimensions: overrides.dimensions ?? [
      { dimension: 'wifi', rating: 4 },
      { dimension: 'safety', rating: 5 },
      { dimension: 'food', rating: 3 },
      { dimension: 'nightlife', rating: 2 },
      { dimension: 'walkability', rating: 4 },
      { dimension: 'cost_value', rating: 3 },
    ],
    neighborhood: {
      state: overrides.state ?? 'CA',
      walkScoreCache:
        overrides.walkScore === undefined
          ? { walkScore: 85 }
          : overrides.walkScore === null
            ? null
            : { walkScore: overrides.walkScore },
    },
  };
}

describe('buildUserProfile', () => {
  it('returns a zero dimension vector when no dimension ratings exist', () => {
    const profile = buildUserProfile([
      { dimensions: [], neighborhood: { state: 'CA', walkScoreCache: null } },
    ]);
    expect(profile.dimensionVector).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('averages dimension ratings across multiple reviews', () => {
    const profile = buildUserProfile([
      makeReview({
        dimensions: [
          { dimension: 'wifi', rating: 4 },
          { dimension: 'safety', rating: 5 },
        ],
      }),
      makeReview({
        dimensions: [
          { dimension: 'wifi', rating: 2 },
          { dimension: 'safety', rating: 3 },
        ],
      }),
    ]);
    // wifi avg = 3, safety avg = 4, all others 0
    expect(profile.dimensionVector[REVIEW_DIMENSIONS.indexOf('wifi')]).toBeCloseTo(3, 4);
    expect(profile.dimensionVector[REVIEW_DIMENSIONS.indexOf('safety')]).toBeCloseTo(4, 4);
    expect(profile.dimensionVector[REVIEW_DIMENSIONS.indexOf('food')]).toBe(0);
  });

  it('builds walkScoreRange from neighborhood cache data', () => {
    const profile = buildUserProfile([
      makeReview({ walkScore: 70 }),
      makeReview({ walkScore: 90 }),
      makeReview({ walkScore: 80 }),
    ]);
    expect(profile.walkScoreRange).toEqual({ min: 70, max: 90 });
  });

  it('returns null walkScoreRange when no walk scores available', () => {
    const profile = buildUserProfile([
      makeReview({ walkScore: null }),
      makeReview({ walkScore: null }),
    ]);
    expect(profile.walkScoreRange).toBeNull();
  });

  it('extracts preferred states from review neighborhoods', () => {
    const profile = buildUserProfile([
      makeReview({ state: 'CA' }),
      makeReview({ state: 'NY' }),
      makeReview({ state: 'CA' }),
    ]);
    expect(profile.preferredStates.sort()).toEqual(['CA', 'NY']);
  });

  it('handles a single review correctly', () => {
    const profile = buildUserProfile([
      makeReview({
        dimensions: [{ dimension: 'food', rating: 5 }],
        state: 'TX',
        walkScore: 60,
      }),
    ]);
    expect(profile.dimensionVector[REVIEW_DIMENSIONS.indexOf('food')]).toBe(5);
    expect(profile.walkScoreRange).toEqual({ min: 60, max: 60 });
    expect(profile.preferredStates).toEqual(['TX']);
  });

  it('handles reviews with partial dimension data', () => {
    const profile = buildUserProfile([
      makeReview({ dimensions: [{ dimension: 'wifi', rating: 5 }] }),
      makeReview({ dimensions: [{ dimension: 'safety', rating: 4 }] }),
    ]);
    expect(profile.dimensionVector[REVIEW_DIMENSIONS.indexOf('wifi')]).toBe(5);
    expect(profile.dimensionVector[REVIEW_DIMENSIONS.indexOf('safety')]).toBe(4);
    expect(profile.dimensionVector[REVIEW_DIMENSIONS.indexOf('food')]).toBe(0);
  });

  it('initializes rentRange and crimeTolerance to null (filled by caller)', () => {
    const profile = buildUserProfile([makeReview()]);
    expect(profile.rentRange).toBeNull();
    expect(profile.crimeTolerance).toBeNull();
  });
});

describe('buildNeighborhoodDimensionVector', () => {
  it('returns a zero vector for a neighborhood with no reviews', () => {
    expect(buildNeighborhoodDimensionVector({ reviews: [] })).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('returns a zero vector when reviews is undefined', () => {
    expect(buildNeighborhoodDimensionVector({})).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('returns correct averages with multiple reviews', () => {
    const vec = buildNeighborhoodDimensionVector({
      reviews: [
        {
          dimensions: [
            { dimension: 'wifi', rating: 4 },
            { dimension: 'safety', rating: 5 },
          ],
        },
        {
          dimensions: [
            { dimension: 'wifi', rating: 2 },
            { dimension: 'safety', rating: 3 },
          ],
        },
      ],
    });
    expect(vec[REVIEW_DIMENSIONS.indexOf('wifi')]).toBeCloseTo(3, 4);
    expect(vec[REVIEW_DIMENSIONS.indexOf('safety')]).toBeCloseTo(4, 4);
  });

  it('skips reviews missing the dimensions property', () => {
    const vec = buildNeighborhoodDimensionVector({
      reviews: [
        { rating: 5 },
        { dimensions: [{ dimension: 'food', rating: 4 }] },
      ],
    });
    expect(vec[REVIEW_DIMENSIONS.indexOf('food')]).toBe(4);
  });

  it('vector length always equals REVIEW_DIMENSIONS.length', () => {
    expect(buildNeighborhoodDimensionVector({}).length).toBe(REVIEW_DIMENSIONS.length);
    expect(buildNeighborhoodDimensionVector({ reviews: [] }).length).toBe(REVIEW_DIMENSIONS.length);
    expect(REVIEW_DIMENSIONS.length).toBe(6);
  });
});
