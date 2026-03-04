import { prisma } from '@/server/prisma';
import { env } from '@/server/env';
import type { CrimeData } from './types';

const FBI_API_BASE = 'https://api.usa.gov/crime/fbi/sapi';
const CACHE_TTL_DAYS = 90;

type FbiAgency = {
  ori: string;
  agency_name: string;
  city_name: string | null;
  state_abbr: string;
};

type FbiCrimeSummary = {
  results: {
    data_year: number;
    actual: number;
  }[];
};

/**
 * Fuzzy-match a city name against FBI agency records.
 * Matches "police department" agencies first, then any agency in that city.
 */
function findBestAgency(
  agencies: FbiAgency[],
  targetCity: string,
): FbiAgency | null {
  const normalized = targetCity.toLowerCase().trim();

  // Filter agencies whose city matches
  const cityMatches = agencies.filter(
    (a) => a.city_name?.toLowerCase().trim() === normalized,
  );

  if (cityMatches.length === 0) return null;

  // Prefer police departments
  const pd = cityMatches.find((a) =>
    a.agency_name.toLowerCase().includes('police'),
  );
  return pd ?? cityMatches[0] ?? null;
}

/**
 * Fetch crime data for a single city/state and cache in DB.
 */
export async function fetchCrimeData(
  city: string,
  state: string,
): Promise<CrimeData | null> {
  const apiKey = env.FBI_CRIME_API_KEY;
  if (!apiKey) return null;

  try {
    // Step 1: Find ORI code by state, then match city
    const agencyRes = await fetch(
      `${FBI_API_BASE}/api/agencies/byStateAbbr/${state}?api_key=${apiKey}`,
    );
    if (!agencyRes.ok) return null;

    const agencyData: { results: FbiAgency[] } = await agencyRes.json();
    const agency = findBestAgency(agencyData.results ?? [], city);

    if (!agency) {
      // No agency found: cache as unavailable so we don't retry
      return saveCacheEntry(city, state, null, null, null, null, null, 'unavailable', {});
    }

    // Step 2: Fetch violent crime and property crime summaries
    const [violentRes, propertyRes] = await Promise.all([
      fetch(
        `${FBI_API_BASE}/api/summarized/agencies/${agency.ori}/violent-crime?api_key=${apiKey}`,
      ),
      fetch(
        `${FBI_API_BASE}/api/summarized/agencies/${agency.ori}/property-crime?api_key=${apiKey}`,
      ),
    ]);

    if (!violentRes.ok || !propertyRes.ok) {
      return saveCacheEntry(city, state, agency.ori, null, null, null, null, 'unavailable', {});
    }

    const violentData: FbiCrimeSummary = await violentRes.json();
    const propertyData: FbiCrimeSummary = await propertyRes.json();

    // Get the most recent year with data
    const violentYears = (violentData.results ?? []).sort(
      (a, b) => b.data_year - a.data_year,
    );
    const propertyYears = (propertyData.results ?? []).sort(
      (a, b) => b.data_year - a.data_year,
    );

    const latestViolent = violentYears[0];
    const latestProperty = propertyYears[0];

    if (!latestViolent && !latestProperty) {
      return saveCacheEntry(city, state, agency.ori, null, null, null, null, 'unavailable', {
        violent: violentData,
        property: propertyData,
      });
    }

    // Use the year that has the most data
    const dataYear = latestViolent?.data_year ?? latestProperty?.data_year ?? null;

    // We need population to compute per-capita rates.
    // FBI summarized endpoint doesn't always include population directly.
    // We'll fetch it from the agency detail if available, or estimate.
    let population: number | null = null;
    let violentRate: number | null = null;
    let propertyRate: number | null = null;
    let quality: CrimeData['dataQuality'] = 'unavailable';

    // Try to get population from a separate call
    const detailRes = await fetch(
      `${FBI_API_BASE}/api/agencies/${agency.ori}?api_key=${apiKey}`,
    );
    if (detailRes.ok) {
      const detail = await detailRes.json();
      // FBI agency detail sometimes has county population or agency population
      population =
        detail.nibrs_start_date != null
          ? (detail.population ?? null)
          : (detail.population ?? null);
    }

    if (population && population > 0) {
      if (latestViolent) {
        violentRate = (latestViolent.actual / population) * 100_000;
      }
      if (latestProperty) {
        propertyRate = (latestProperty.actual / population) * 100_000;
      }
      quality =
        latestViolent && latestProperty ? 'complete' : 'partial';
    } else {
      // Store raw counts without per-capita conversion
      violentRate = latestViolent?.actual ?? null;
      propertyRate = latestProperty?.actual ?? null;
      quality = 'partial';
    }

    return saveCacheEntry(city, state, agency.ori, violentRate, propertyRate, population, dataYear, quality, {
      violent: violentData,
      property: propertyData,
    });
  } catch {
    return null;
  }
}

async function saveCacheEntry(
  city: string,
  state: string,
  oriCode: string | null,
  violentCrimeRate: number | null,
  propertyCrimeRate: number | null,
  population: number | null,
  dataYear: number | null,
  dataQuality: CrimeData['dataQuality'],
  rawResponse: unknown,
): Promise<CrimeData> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);

  const cached = await prisma.crimeDataCache.upsert({
    where: { city_state: { city, state } },
    create: {
      city,
      state,
      oriCode,
      violentCrimeRate,
      propertyCrimeRate,
      population,
      dataYear,
      dataQuality,
      rawResponse: JSON.parse(JSON.stringify(rawResponse)),
      fetchedAt: now,
      expiresAt,
    },
    update: {
      oriCode,
      violentCrimeRate,
      propertyCrimeRate,
      population,
      dataYear,
      dataQuality,
      rawResponse: JSON.parse(JSON.stringify(rawResponse)),
      fetchedAt: now,
      expiresAt,
    },
  });

  return {
    city: cached.city,
    state: cached.state,
    oriCode: cached.oriCode,
    violentCrimeRate: cached.violentCrimeRate,
    propertyCrimeRate: cached.propertyCrimeRate,
    population: cached.population,
    dataYear: cached.dataYear,
    dataQuality: cached.dataQuality as CrimeData['dataQuality'],
    fetchedAt: cached.fetchedAt,
  };
}

/**
 * Fetch crime data for all unique city/state pairs across neighborhoods.
 * Skips pairs with valid (non-expired) cache.
 */
export async function fetchAllCrimeData(): Promise<{
  fetched: number;
  skipped: number;
  failed: number;
}> {
  if (!env.FBI_CRIME_API_KEY) {
    return { fetched: 0, skipped: 0, failed: 0 };
  }

  const neighborhoods = await prisma.neighborhood.findMany({
    select: { city: true, state: true },
    distinct: ['city', 'state'],
  });

  const now = new Date();
  const existing = await prisma.crimeDataCache.findMany({
    where: { expiresAt: { gt: now } },
    select: { city: true, state: true },
  });
  const cachedKeys = new Set(existing.map((e) => `${e.city}|${e.state}`));

  let fetched = 0;
  let skipped = 0;
  let failed = 0;

  for (const n of neighborhoods) {
    if (cachedKeys.has(`${n.city}|${n.state}`)) {
      skipped++;
      continue;
    }

    const result = await fetchCrimeData(n.city, n.state);
    if (result) {
      fetched++;
    } else {
      failed++;
    }

    // Respect rate limits: delay between calls
    await new Promise((r) => setTimeout(r, 500));
  }

  return { fetched, skipped, failed };
}

/**
 * Read crime data from DB cache for a neighborhood's city/state. No API calls.
 */
export async function getCrimeData(
  neighborhoodId: string,
): Promise<CrimeData | null> {
  const neighborhood = await prisma.neighborhood.findUnique({
    where: { id: neighborhoodId },
    select: { city: true, state: true },
  });

  if (!neighborhood) return null;

  const cached = await prisma.crimeDataCache.findUnique({
    where: { city_state: { city: neighborhood.city, state: neighborhood.state } },
  });

  if (!cached) return null;

  return {
    city: cached.city,
    state: cached.state,
    oriCode: cached.oriCode,
    violentCrimeRate: cached.violentCrimeRate,
    propertyCrimeRate: cached.propertyCrimeRate,
    population: cached.population,
    dataYear: cached.dataYear,
    dataQuality: cached.dataQuality as CrimeData['dataQuality'],
    fetchedAt: cached.fetchedAt,
  };
}
