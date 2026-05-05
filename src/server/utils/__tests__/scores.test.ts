import {
  calculateAvgRating,
  calculateNomadScore,
  calculateEnhancedNomadScore,
} from '@/server/utils/scores';
import type { NeighborhoodExternalData } from '@/server/services/types';

const fullExternalData: NeighborhoodExternalData = {
  walkScore: {
    walkScore: 85,
    transitScore: 70,
    bikeScore: 60,
    walkDescription: null,
    transitDescription: null,
    bikeDescription: null,
    fetchedAt: new Date(),
  },
  rentData: {
    zip: '89052',
    medianRent: 1500,
    medianRentSqft: null,
    medianSalePrice: null,
    medianSaleSqft: null,
    fetchedAt: new Date(),
  },
  crimeData: {
    city: 'Henderson',
    state: 'NV',
    oriCode: null,
    violentCrimeRate: 200,
    propertyCrimeRate: 1500,
    population: null,
    dataYear: null,
    dataQuality: 'complete',
    fetchedAt: new Date(),
  },
  costOfLiving: { cpi: null, wage: null },
  events: null,
  images: [],
};

describe('calculateAvgRating', () => {
  it('returns null for an empty array', () => {
    expect(calculateAvgRating([])).toBeNull();
  });

  it('returns the rating for a single review', () => {
    expect(calculateAvgRating([{ rating: 4 }])).toBe(4);
  });

  it('returns the correct average for multiple reviews', () => {
    expect(calculateAvgRating([{ rating: 5 }, { rating: 3 }, { rating: 4 }])).toBeCloseTo(4, 4);
  });

  it('handles decimal ratings', () => {
    expect(calculateAvgRating([{ rating: 3.5 }, { rating: 4.5 }])).toBeCloseTo(4, 4);
  });
});

describe('calculateNomadScore', () => {
  it('returns 100 for perfect scores (5/5 rating, max reviews, max favorites)', () => {
    expect(calculateNomadScore(5, 10, 5, 10, 5)).toBe(100);
  });

  it('returns 0 when everything is zero', () => {
    expect(calculateNomadScore(0, 0, 0, 1, 1)).toBe(0);
  });

  it('weights rating-only at 50%', () => {
    // 5/5 rating, no reviews, no favorites → 50
    expect(calculateNomadScore(5, 0, 0, 10, 10)).toBe(50);
  });

  it('weights reviews-only at 30%', () => {
    // No rating, max reviews, no favorites → 30
    expect(calculateNomadScore(null, 10, 0, 10, 10)).toBe(30);
  });

  it('weights favorites-only at 20%', () => {
    // No rating, no reviews, max favorites → 20
    expect(calculateNomadScore(null, 0, 10, 10, 10)).toBe(20);
  });

  it('returns a rounded integer', () => {
    const result = calculateNomadScore(4, 3, 2, 7, 7);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('treats null avgRating as 0', () => {
    expect(calculateNomadScore(null, 10, 10, 10, 10)).toBe(50);
  });
});

describe('calculateEnhancedNomadScore', () => {
  it('falls back to community-only when externalData is undefined', () => {
    const community = calculateNomadScore(4, 5, 3, 10, 10);
    expect(calculateEnhancedNomadScore(4, 5, 3, 10, 10)).toBe(community);
  });

  it('falls back when externalData has no walk/rent/crime', () => {
    const community = calculateNomadScore(4, 5, 3, 10, 10);
    const empty: NeighborhoodExternalData = {
      walkScore: null,
      rentData: null,
      crimeData: null,
      costOfLiving: { cpi: null, wage: null },
      events: null,
      images: [],
    };
    expect(calculateEnhancedNomadScore(4, 5, 3, 10, 10, empty)).toBe(community);
  });

  it('all 7 weight buckets contribute with full external data', () => {
    // Sanity check: with all data, perfect inputs = 100
    const score = calculateEnhancedNomadScore(5, 10, 10, 10, 10, {
      ...fullExternalData,
      walkScore: {
        ...fullExternalData.walkScore!,
        walkScore: 100,
        transitScore: 100,
        bikeScore: 100,
      },
      crimeData: { ...fullExternalData.crimeData!, violentCrimeRate: 0 },
      rentData: { ...fullExternalData.rentData!, medianRent: 500 },
    });
    expect(score).toBe(100);
  });

  it('walkScore of 100 contributes the full 15% walkability bucket', () => {
    // Isolate walkability: zero everything else
    const data: NeighborhoodExternalData = {
      walkScore: {
        walkScore: 100,
        transitScore: null,
        bikeScore: null,
        walkDescription: null,
        transitDescription: null,
        bikeDescription: null,
        fetchedAt: new Date(),
      },
      rentData: { zip: 'x', medianRent: 5000, medianRentSqft: null, medianSalePrice: null, medianSaleSqft: null, fetchedAt: new Date() },
      crimeData: { city: '', state: '', oriCode: null, violentCrimeRate: 1000, propertyCrimeRate: null, population: null, dataYear: null, dataQuality: 'complete', fetchedAt: new Date() },
      costOfLiving: { cpi: null, wage: null },
      events: null,
      images: [],
    };
    // avgRating=0, no reviews, no favorites → community sub buckets all 0
    // walkability = 15
    // transit/bike fallback = (0/5)*10 = 0
    // safety = (1 - 1000/1000) * 15 = 0
    // affordability = (1 - 4500/4500) * 20 = 0
    expect(calculateEnhancedNomadScore(0, 0, 0, 10, 10, data)).toBe(15);
  });

  it('rent of $500 contributes the full 20% affordability bucket', () => {
    const data: NeighborhoodExternalData = {
      walkScore: { walkScore: 0, transitScore: null, bikeScore: null, walkDescription: null, transitDescription: null, bikeDescription: null, fetchedAt: new Date() },
      rentData: { zip: 'x', medianRent: 500, medianRentSqft: null, medianSalePrice: null, medianSaleSqft: null, fetchedAt: new Date() },
      crimeData: { city: '', state: '', oriCode: null, violentCrimeRate: 1000, propertyCrimeRate: null, population: null, dataYear: null, dataQuality: 'complete', fetchedAt: new Date() },
      costOfLiving: { cpi: null, wage: null },
      events: null,
      images: [],
    };
    // affordability = 20, all other contributions 0
    expect(calculateEnhancedNomadScore(0, 0, 0, 10, 10, data)).toBe(20);
  });

  it('rent of $5000 contributes 0% to affordability', () => {
    const data: NeighborhoodExternalData = {
      walkScore: { walkScore: 0, transitScore: null, bikeScore: null, walkDescription: null, transitDescription: null, bikeDescription: null, fetchedAt: new Date() },
      rentData: { zip: 'x', medianRent: 5000, medianRentSqft: null, medianSalePrice: null, medianSaleSqft: null, fetchedAt: new Date() },
      crimeData: { city: '', state: '', oriCode: null, violentCrimeRate: 1000, propertyCrimeRate: null, population: null, dataYear: null, dataQuality: 'complete', fetchedAt: new Date() },
      costOfLiving: { cpi: null, wage: null },
      events: null,
      images: [],
    };
    expect(calculateEnhancedNomadScore(0, 0, 0, 10, 10, data)).toBe(0);
  });

  it('crime rate of 0 contributes the full 15% safety bucket', () => {
    const data: NeighborhoodExternalData = {
      walkScore: { walkScore: 0, transitScore: null, bikeScore: null, walkDescription: null, transitDescription: null, bikeDescription: null, fetchedAt: new Date() },
      rentData: { zip: 'x', medianRent: 5000, medianRentSqft: null, medianSalePrice: null, medianSaleSqft: null, fetchedAt: new Date() },
      crimeData: { city: '', state: '', oriCode: null, violentCrimeRate: 0, propertyCrimeRate: null, population: null, dataYear: null, dataQuality: 'complete', fetchedAt: new Date() },
      costOfLiving: { cpi: null, wage: null },
      events: null,
      images: [],
    };
    expect(calculateEnhancedNomadScore(0, 0, 0, 10, 10, data)).toBe(15);
  });

  it('crime rate of 1000+ is capped and contributes 0% to safety', () => {
    const data: NeighborhoodExternalData = {
      walkScore: { walkScore: 0, transitScore: null, bikeScore: null, walkDescription: null, transitDescription: null, bikeDescription: null, fetchedAt: new Date() },
      rentData: { zip: 'x', medianRent: 5000, medianRentSqft: null, medianSalePrice: null, medianSaleSqft: null, fetchedAt: new Date() },
      crimeData: { city: '', state: '', oriCode: null, violentCrimeRate: 5000, propertyCrimeRate: null, population: null, dataYear: null, dataQuality: 'complete', fetchedAt: new Date() },
      costOfLiving: { cpi: null, wage: null },
      events: null,
      images: [],
    };
    expect(calculateEnhancedNomadScore(0, 0, 0, 10, 10, data)).toBe(0);
  });

  it('redistributes walkability to community rating when walkScore is missing', () => {
    // walkScore null, but other external data present so we don't fall back to community-only
    const data: NeighborhoodExternalData = {
      walkScore: null,
      rentData: { zip: 'x', medianRent: 5000, medianRentSqft: null, medianSalePrice: null, medianSaleSqft: null, fetchedAt: new Date() },
      crimeData: { city: '', state: '', oriCode: null, violentCrimeRate: 1000, propertyCrimeRate: null, population: null, dataYear: null, dataQuality: 'complete', fetchedAt: new Date() },
      costOfLiving: { cpi: null, wage: null },
      events: null,
      images: [],
    };
    // avgRating 5 / 5 = 1
    // community buckets: 20 (rating) + 0 + 0
    // walkability fallback: 1 * 15 = 15
    // transit/bike fallback: 1 * 10 = 10
    // safety: 0
    // affordability: 0
    // total = 45
    expect(calculateEnhancedNomadScore(5, 0, 0, 10, 10, data)).toBe(45);
  });

  it('redistributes transit/bike when both are null but walkScore exists', () => {
    const data: NeighborhoodExternalData = {
      walkScore: {
        walkScore: 0,
        transitScore: null,
        bikeScore: null,
        walkDescription: null,
        transitDescription: null,
        bikeDescription: null,
        fetchedAt: new Date(),
      },
      rentData: { zip: 'x', medianRent: 5000, medianRentSqft: null, medianSalePrice: null, medianSaleSqft: null, fetchedAt: new Date() },
      crimeData: { city: '', state: '', oriCode: null, violentCrimeRate: 1000, propertyCrimeRate: null, population: null, dataYear: null, dataQuality: 'complete', fetchedAt: new Date() },
      costOfLiving: { cpi: null, wage: null },
      events: null,
      images: [],
    };
    // rating bucket: 5/5 * 20 = 20
    // walkability: 0
    // transit/bike fallback: 1 * 10 = 10
    // safety: 0, affordability: 0
    // total = 30
    expect(calculateEnhancedNomadScore(5, 0, 0, 10, 10, data)).toBe(30);
  });

  it('redistributes safety when crime data is null but other external data exists', () => {
    const data: NeighborhoodExternalData = {
      walkScore: { walkScore: 0, transitScore: 0, bikeScore: 0, walkDescription: null, transitDescription: null, bikeDescription: null, fetchedAt: new Date() },
      rentData: { zip: 'x', medianRent: 5000, medianRentSqft: null, medianSalePrice: null, medianSaleSqft: null, fetchedAt: new Date() },
      crimeData: null,
      costOfLiving: { cpi: null, wage: null },
      events: null,
      images: [],
    };
    // rating: 5/5 * 20 = 20
    // walkability: 0, transit/bike: 0
    // safety fallback: 1 * 15 = 15
    // affordability: 0
    // total = 35
    expect(calculateEnhancedNomadScore(5, 0, 0, 10, 10, data)).toBe(35);
  });

  it('redistributes affordability when rent data is null but other external data exists', () => {
    const data: NeighborhoodExternalData = {
      walkScore: { walkScore: 0, transitScore: 0, bikeScore: 0, walkDescription: null, transitDescription: null, bikeDescription: null, fetchedAt: new Date() },
      rentData: null,
      crimeData: { city: '', state: '', oriCode: null, violentCrimeRate: 1000, propertyCrimeRate: null, population: null, dataYear: null, dataQuality: 'complete', fetchedAt: new Date() },
      costOfLiving: { cpi: null, wage: null },
      events: null,
      images: [],
    };
    // rating: 5/5 * 20 = 20
    // walkability: 0, transit/bike: 0, safety: 0
    // affordability fallback: 1 * 20 = 20
    // total = 40
    expect(calculateEnhancedNomadScore(5, 0, 0, 10, 10, data)).toBe(40);
  });

  it('result is clamped between 0 and 100', () => {
    const score = calculateEnhancedNomadScore(5, 100, 100, 10, 10, fullExternalData);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('result is always a rounded integer', () => {
    const score = calculateEnhancedNomadScore(3.7, 4, 2, 9, 7, fullExternalData);
    expect(Number.isInteger(score)).toBe(true);
  });
});
