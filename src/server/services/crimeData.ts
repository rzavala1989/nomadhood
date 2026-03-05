import { prisma } from '@/server/prisma';
import { env } from '@/server/env';
import type { CrimeData } from './types';

const FBI_CDE_BASE = 'https://api.usa.gov/crime/fbi/cde';
const CACHE_TTL_DAYS = 90;

type CdeRatesResponse = {
  offenses?: {
    rates?: Record<string, Record<string, number>>;
  };
};

/**
 * Extract the most recent annual rate from FBI CDE monthly data.
 * The API returns monthly rates keyed as "MM-YYYY". We sum the 12 months
 * of the most recent full year to get an annualized rate per 100k.
 */
function extractAnnualRate(
  rates: Record<string, number>,
): { rate: number; year: number } | null {
  // Group by year
  const byYear = new Map<number, number[]>();
  for (const [key, value] of Object.entries(rates)) {
    const parts = key.split('-');
    if (parts.length !== 2) continue;
    const yearStr = parts[1];
    if (!yearStr) continue;
    const year = parseInt(yearStr, 10);
    if (isNaN(year)) continue;
    const existing = byYear.get(year) ?? [];
    existing.push(value);
    byYear.set(year, existing);
  }

  // Find the most recent year with all 12 months (or closest to it)
  const years = [...byYear.keys()].sort((a, b) => b - a);
  for (const year of years) {
    const months = byYear.get(year)!;
    if (months.length >= 10) {
      // Sum monthly rates to approximate annual rate
      const annual = months.reduce((sum, v) => sum + v, 0);
      return { rate: Math.round(annual * 10) / 10, year };
    }
  }

  return null;
}

/**
 * Fetch state-level crime data from FBI CDE and cache in DB.
 * Data is per-state (the finest grain available from this API).
 */
export async function fetchCrimeData(
  city: string,
  state: string,
): Promise<CrimeData | null> {
  const apiKey = env.FBI_CRIME_DATA_API_KEY;
  if (!apiKey) return null;

  try {
    const from = '01-2020';
    const to = '12-2024';

    const [violentRes, propertyRes] = await Promise.all([
      fetch(
        `${FBI_CDE_BASE}/summarized/state/${state}/violent-crime?from=${from}&to=${to}&api_key=${apiKey}`,
      ),
      fetch(
        `${FBI_CDE_BASE}/summarized/state/${state}/property-crime?from=${from}&to=${to}&api_key=${apiKey}`,
      ),
    ]);

    if (!violentRes.ok && !propertyRes.ok) {
      return saveCacheEntry(city, state, null, null, null, null, 'unavailable', {});
    }

    const violentData: CdeRatesResponse = violentRes.ok
      ? await violentRes.json()
      : {};
    const propertyData: CdeRatesResponse = propertyRes.ok
      ? await propertyRes.json()
      : {};

    // Extract rates from the first key in the rates object (state name)
    const violentRates = violentData.offenses?.rates
      ? Object.values(violentData.offenses.rates)[0]
      : undefined;
    const propertyRates = propertyData.offenses?.rates
      ? Object.values(propertyData.offenses.rates)[0]
      : undefined;

    const violent = violentRates ? extractAnnualRate(violentRates) : null;
    const property = propertyRates ? extractAnnualRate(propertyRates) : null;

    if (!violent && !property) {
      return saveCacheEntry(city, state, null, null, null, null, 'unavailable', {
        violent: violentData,
        property: propertyData,
      });
    }

    const dataYear = violent?.year ?? property?.year ?? null;
    const quality: CrimeData['dataQuality'] =
      violent && property ? 'complete' : 'partial';

    return saveCacheEntry(
      city,
      state,
      violent?.rate ?? null,
      property?.rate ?? null,
      null,
      dataYear,
      quality,
      { violent: violentData, property: propertyData },
    );
  } catch {
    return null;
  }
}

async function saveCacheEntry(
  city: string,
  state: string,
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
      oriCode: null,
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
 * Fetch crime data for all unique city/state pairs.
 * Since data is state-level, we fetch once per state and propagate
 * to all cities in that state.
 */
export async function fetchAllCrimeData(): Promise<{
  fetched: number;
  skipped: number;
  failed: number;
}> {
  if (!env.FBI_CRIME_DATA_API_KEY) {
    return { fetched: 0, skipped: 0, failed: 0 };
  }

  const neighborhoods = await prisma.neighborhood.findMany({
    select: { city: true, state: true },
    distinct: ['city', 'state'],
  });

  // Group cities by state so we only call the API once per state
  const stateGroups = new Map<string, string[]>();
  for (const n of neighborhoods) {
    const cities = stateGroups.get(n.state) ?? [];
    if (!cities.includes(n.city)) cities.push(n.city);
    stateGroups.set(n.state, cities);
  }

  const now = new Date();
  const existing = await prisma.crimeDataCache.findMany({
    where: { expiresAt: { gt: now } },
    select: { city: true, state: true },
  });
  const cachedKeys = new Set(existing.map((e) => `${e.city}|${e.state}`));

  let fetched = 0;
  let skipped = 0;
  let failed = 0;

  for (const [state, cities] of stateGroups) {
    const uncachedCities = cities.filter((c) => !cachedKeys.has(`${c}|${state}`));
    if (uncachedCities.length === 0) {
      skipped += cities.length;
      continue;
    }

    // Fetch once for the first city (data is state-level anyway)
    const representativeCity = uncachedCities[0];
    if (!representativeCity) continue;
    const result = await fetchCrimeData(representativeCity, state);

    if (result) {
      fetched++;

      // Propagate to other cities in the same state
      for (const city of uncachedCities.slice(1)) {
        try {
          await saveCacheEntry(
            city,
            state,
            result.violentCrimeRate,
            result.propertyCrimeRate,
            result.population,
            result.dataYear,
            result.dataQuality,
            {},
          );
          fetched++;
        } catch {
          failed++;
        }
      }
    } else {
      failed += uncachedCities.length;
    }

    await new Promise((r) => setTimeout(r, 300));
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
