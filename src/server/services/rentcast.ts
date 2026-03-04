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
 * Fetch Rentcast data for all unique zip codes across neighborhoods.
 * Skips zips with valid (non-expired) cache.
 */
export async function fetchAllRentData(): Promise<{
  fetched: number;
  skipped: number;
  failed: number;
  rateLimited: boolean;
}> {
  if (!env.RENTCAST_API_KEY) {
    return { fetched: 0, skipped: 0, failed: 0, rateLimited: false };
  }

  // Get unique zips from neighborhoods
  const neighborhoods = await prisma.neighborhood.findMany({
    select: { zip: true },
    distinct: ['zip'],
  });
  const allZips = neighborhoods.map((n) => n.zip);

  // Filter out zips with valid cache
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

  for (const zip of allZips) {
    if (cachedZips.has(zip)) {
      skipped++;
      continue;
    }

    if (!(await canMakeCall())) {
      rateLimited = true;
      break;
    }

    const result = await fetchRentData(zip);
    if (result) {
      fetched++;
    } else {
      failed++;
    }

    // Small delay between calls
    await new Promise((r) => setTimeout(r, 300));
  }

  return { fetched, skipped, failed, rateLimited };
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
