import { prisma } from '@/server/prisma';
import { env } from '@/server/env';
import type { RentData, RateLimitInfo } from './types';

const RENTCAST_API_URL = 'https://api.rentcast.io/v1/markets';
const CACHE_TTL_DAYS = 30;
const MONTHLY_CALL_CAP = 45; // hard cap (50 real limit, 5 buffer)

type RentcastMarketResponse = {
  rentalData?: {
    averageRent?: number;
    averageRentPerSqFt?: number;
    medianRent?: number;
    medianRentPerSqFt?: number;
  };
  saleData?: {
    averageSalePrice?: number;
    averageSalePricePerSqFt?: number;
    medianSalePrice?: number;
    medianSalePricePerSqFt?: number;
  };
};

// --- Rate Limit Guard ---

async function getOrCreateTracker() {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const existing = await prisma.apiRateLimitTracker.findUnique({
    where: { apiName: 'rentcast' },
  });

  // If tracker exists and is in the current billing period, return it
  if (existing && existing.periodStart >= periodStart) {
    return existing;
  }

  // Reset or create tracker for the new period
  return prisma.apiRateLimitTracker.upsert({
    where: { apiName: 'rentcast' },
    create: {
      apiName: 'rentcast',
      callCount: 0,
      periodStart,
      periodEnd,
    },
    update: {
      callCount: 0,
      periodStart,
      periodEnd,
    },
  });
}

async function canMakeCall(): Promise<boolean> {
  const tracker = await getOrCreateTracker();
  return tracker.callCount < MONTHLY_CALL_CAP;
}

async function recordCall() {
  const now = new Date();
  await prisma.apiRateLimitTracker.update({
    where: { apiName: 'rentcast' },
    data: {
      callCount: { increment: 1 },
      lastCalledAt: now,
    },
  });
}

// --- Service Functions ---

/**
 * Fetch Rentcast data for a single zip code and cache in DB.
 * Returns null if rate limited, key missing, or API fails.
 */
export async function fetchRentData(zip: string): Promise<RentData | null> {
  const apiKey = env.RENTCAST_API_KEY;
  if (!apiKey) return null;

  if (!(await canMakeCall())) {
    console.warn('[rentcast] Monthly call cap reached, skipping fetch');
    return null;
  }

  const params = new URLSearchParams({
    zipCode: zip,
    dataType: 'All',
    historyRange: '12',
  });

  try {
    const res = await fetch(`${RENTCAST_API_URL}?${params}`, {
      headers: { 'X-Api-Key': apiKey },
    });

    if (!res.ok) return null;

    await recordCall();

    const data: RentcastMarketResponse = await res.json();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);

    const cached = await prisma.rentcastCache.upsert({
      where: { zip },
      create: {
        zip,
        medianRent: data.rentalData?.medianRent ?? null,
        medianRentSqft: data.rentalData?.medianRentPerSqFt ?? null,
        medianSalePrice: data.saleData?.medianSalePrice ?? null,
        medianSaleSqft: data.saleData?.medianSalePricePerSqFt ?? null,
        rawResponse: JSON.parse(JSON.stringify(data)),
        fetchedAt: now,
        expiresAt,
      },
      update: {
        medianRent: data.rentalData?.medianRent ?? null,
        medianRentSqft: data.rentalData?.medianRentPerSqFt ?? null,
        medianSalePrice: data.saleData?.medianSalePrice ?? null,
        medianSaleSqft: data.saleData?.medianSalePricePerSqFt ?? null,
        rawResponse: JSON.parse(JSON.stringify(data)),
        fetchedAt: now,
        expiresAt,
      },
    });

    return {
      zip: cached.zip,
      medianRent: cached.medianRent,
      medianRentSqft: cached.medianRentSqft,
      medianSalePrice: cached.medianSalePrice,
      medianSaleSqft: cached.medianSaleSqft,
      fetchedAt: cached.fetchedAt,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch Rentcast data using one representative zip per city, then propagate
 * the result to all sibling zips in that city. This minimizes API calls:
 * ~16 calls for 69 unique zips instead of 69.
 *
 * Adjacent zips within the same city share a housing market, so one data
 * point per city is a reasonable approximation.
 */
export async function fetchAllRentData(): Promise<{
  fetched: number;
  skipped: number;
  failed: number;
  rateLimited: boolean;
  propagated: number;
}> {
  if (!env.RENTCAST_API_KEY) {
    return { fetched: 0, skipped: 0, failed: 0, rateLimited: false, propagated: 0 };
  }

  // Group zips by city/state
  const neighborhoods = await prisma.neighborhood.findMany({
    select: { zip: true, city: true, state: true },
  });

  const cityZips = new Map<string, string[]>();
  for (const n of neighborhoods) {
    const key = `${n.city}|${n.state}`;
    const zips = cityZips.get(key) ?? [];
    if (!zips.includes(n.zip)) zips.push(n.zip);
    cityZips.set(key, zips);
  }

  // Check which zips already have valid cache
  const now = new Date();
  const existing = await prisma.rentcastCache.findMany({
    where: { expiresAt: { gt: now } },
    select: { zip: true },
  });
  const cachedZips = new Set(existing.map((e) => e.zip));

  let fetched = 0;
  let skipped = 0;
  let failed = 0;
  let rateLimited = false;
  let propagated = 0;

  for (const [, zips] of cityZips) {
    // Pick a representative zip: first one that isn't already cached, or skip all
    const uncachedZips = zips.filter((z) => !cachedZips.has(z));
    if (uncachedZips.length === 0) {
      skipped += zips.length;
      continue;
    }

    // If at least one zip in this city is cached, propagate from it
    const alreadyCached = zips.find((z) => cachedZips.has(z));
    if (alreadyCached) {
      const source = await prisma.rentcastCache.findUnique({
        where: { zip: alreadyCached },
      });
      if (source) {
        propagated += await propagateToSiblings(source, uncachedZips);
        skipped++;
        continue;
      }
    }

    // Fetch one representative zip via API
    if (!(await canMakeCall())) {
      rateLimited = true;
      break;
    }

    const representativeZip = uncachedZips[0];
    if (!representativeZip) continue;
    const result = await fetchRentData(representativeZip);

    if (result) {
      fetched++;

      // Propagate to all other uncached zips in this city
      const siblings = uncachedZips.slice(1);
      if (siblings.length > 0) {
        const source = await prisma.rentcastCache.findUnique({
          where: { zip: representativeZip },
        });
        if (source) {
          propagated += await propagateToSiblings(source, siblings);
        }
      }
    } else {
      failed++;
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  return { fetched, skipped, failed, rateLimited, propagated };
}

/**
 * Copy a cached Rentcast result to sibling zips (same city, different zip codes).
 * Returns the number of successfully propagated entries.
 */
async function propagateToSiblings(
  source: {
    medianRent: number | null;
    medianRentSqft: number | null;
    medianSalePrice: number | null;
    medianSaleSqft: number | null;
    rawResponse: unknown;
    fetchedAt: Date;
    expiresAt: Date;
  },
  siblingZips: string[],
): Promise<number> {
  let count = 0;
  for (const zip of siblingZips) {
    try {
      await prisma.rentcastCache.upsert({
        where: { zip },
        create: {
          zip,
          medianRent: source.medianRent,
          medianRentSqft: source.medianRentSqft,
          medianSalePrice: source.medianSalePrice,
          medianSaleSqft: source.medianSaleSqft,
          rawResponse: JSON.parse(JSON.stringify(source.rawResponse)),
          fetchedAt: source.fetchedAt,
          expiresAt: source.expiresAt,
        },
        update: {
          medianRent: source.medianRent,
          medianRentSqft: source.medianRentSqft,
          medianSalePrice: source.medianSalePrice,
          medianSaleSqft: source.medianSaleSqft,
          rawResponse: JSON.parse(JSON.stringify(source.rawResponse)),
          fetchedAt: source.fetchedAt,
          expiresAt: source.expiresAt,
        },
      });
      count++;
    } catch {
      // Skip on conflict
    }
  }
  return count;
}

/**
 * Read Rentcast data from DB cache for a neighborhood's zip code. No API calls.
 */
export async function getRentData(
  neighborhoodId: string,
): Promise<RentData | null> {
  const neighborhood = await prisma.neighborhood.findUnique({
    where: { id: neighborhoodId },
    select: { zip: true },
  });

  if (!neighborhood) return null;

  const cached = await prisma.rentcastCache.findUnique({
    where: { zip: neighborhood.zip },
  });

  if (!cached) return null;

  return {
    zip: cached.zip,
    medianRent: cached.medianRent,
    medianRentSqft: cached.medianRentSqft,
    medianSalePrice: cached.medianSalePrice,
    medianSaleSqft: cached.medianSaleSqft,
    fetchedAt: cached.fetchedAt,
  };
}

/**
 * Get current Rentcast rate limit usage. Admin only.
 */
export async function getRentcastUsage(): Promise<RateLimitInfo> {
  const tracker = await getOrCreateTracker();
  return {
    apiName: tracker.apiName,
    callCount: tracker.callCount,
    periodStart: tracker.periodStart,
    periodEnd: tracker.periodEnd,
    lastCalledAt: tracker.lastCalledAt,
  };
}
