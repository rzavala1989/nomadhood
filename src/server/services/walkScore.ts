import { prisma } from '@/server/prisma';
import { env } from '@/server/env';
import type { WalkScoreData } from './types';

const WALKSCORE_API_URL = 'https://api.walkscore.com/score';
const CACHE_TTL_DAYS = 60;

type WalkScoreApiResponse = {
  status: number;
  walkscore?: number;
  description?: string;
  transit?: { score: number; description: string };
  bike?: { score: number; description: string };
};

/**
 * Fetch Walk Score for a single neighborhood and cache in DB.
 * Returns the cached data or null on failure.
 */
export async function fetchWalkScore(
  neighborhoodId: string,
): Promise<WalkScoreData | null> {
  const apiKey = env.WALKSCORE_API_KEY;
  if (!apiKey) return null;

  const neighborhood = await prisma.neighborhood.findUnique({
    where: { id: neighborhoodId },
    select: { latitude: true, longitude: true, name: true, city: true, state: true },
  });

  if (!neighborhood?.latitude || !neighborhood?.longitude) return null;

  const address = `${neighborhood.name}, ${neighborhood.city}, ${neighborhood.state}`;
  const params = new URLSearchParams({
    format: 'json',
    lat: neighborhood.latitude.toString(),
    lon: neighborhood.longitude.toString(),
    address,
    transit: '1',
    bike: '1',
    wsapikey: apiKey,
  });

  try {
    const res = await fetch(`${WALKSCORE_API_URL}?${params}`);
    if (!res.ok) return null;

    const data: WalkScoreApiResponse = await res.json();
    if (data.status !== 1) return null;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);

    const cached = await prisma.walkScoreCache.upsert({
      where: { neighborhoodId },
      create: {
        neighborhoodId,
        walkScore: data.walkscore ?? null,
        transitScore: data.transit?.score ?? null,
        bikeScore: data.bike?.score ?? null,
        walkDescription: data.description ?? null,
        transitDescription: data.transit?.description ?? null,
        bikeDescription: data.bike?.description ?? null,
        rawResponse: JSON.parse(JSON.stringify(data)),
        fetchedAt: now,
        expiresAt,
      },
      update: {
        walkScore: data.walkscore ?? null,
        transitScore: data.transit?.score ?? null,
        bikeScore: data.bike?.score ?? null,
        walkDescription: data.description ?? null,
        transitDescription: data.transit?.description ?? null,
        bikeDescription: data.bike?.description ?? null,
        rawResponse: JSON.parse(JSON.stringify(data)),
        fetchedAt: now,
        expiresAt,
      },
    });

    return {
      walkScore: cached.walkScore,
      transitScore: cached.transitScore,
      bikeScore: cached.bikeScore,
      walkDescription: cached.walkDescription,
      transitDescription: cached.transitDescription,
      bikeDescription: cached.bikeDescription,
      fetchedAt: cached.fetchedAt,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch Walk Scores for all neighborhoods that are missing or expired.
 * Returns count of successfully fetched neighborhoods.
 */
export async function fetchAllWalkScores(): Promise<{
  fetched: number;
  skipped: number;
  failed: number;
}> {
  if (!env.WALKSCORE_API_KEY) {
    return { fetched: 0, skipped: 0, failed: 0 };
  }

  const neighborhoods = await prisma.neighborhood.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
    },
    select: { id: true },
  });

  const now = new Date();
  const existing = await prisma.walkScoreCache.findMany({
    where: { expiresAt: { gt: now } },
    select: { neighborhoodId: true },
  });
  const existingIds = new Set(existing.map((e) => e.neighborhoodId));

  let fetched = 0;
  let skipped = 0;
  let failed = 0;

  for (const n of neighborhoods) {
    if (existingIds.has(n.id)) {
      skipped++;
      continue;
    }

    const result = await fetchWalkScore(n.id);
    if (result) {
      fetched++;
    } else {
      failed++;
    }

    // Respect rate limits: small delay between calls
    await new Promise((r) => setTimeout(r, 200));
  }

  return { fetched, skipped, failed };
}

/**
 * Read Walk Score from DB cache. No API calls.
 */
export async function getWalkScore(
  neighborhoodId: string,
): Promise<WalkScoreData | null> {
  const cached = await prisma.walkScoreCache.findUnique({
    where: { neighborhoodId },
  });

  if (!cached) return null;

  return {
    walkScore: cached.walkScore,
    transitScore: cached.transitScore,
    bikeScore: cached.bikeScore,
    walkDescription: cached.walkDescription,
    transitDescription: cached.transitDescription,
    bikeDescription: cached.bikeDescription,
    fetchedAt: cached.fetchedAt,
  };
}
