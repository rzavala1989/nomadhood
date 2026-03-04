import { prisma } from '@/server/prisma';
import { env } from '@/server/env';
import type { BlsData } from './types';

const BLS_API_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';
const CPI_CACHE_TTL_DAYS = 30;
const WAGE_CACHE_TTL_DAYS = 180;

// BLS CPI series IDs by metro area (Consumer Price Index for All Urban Consumers)
// Format: CUURS{area_code}SA0 (all items, seasonally adjusted)
const CPI_SERIES: Record<string, string> = {
  'New York|NY': 'CUURS12ASA0',
  'San Francisco|CA': 'CUURS49DSA0',
  'Los Angeles|CA': 'CUURS49ASA0',
  'Chicago|IL': 'CUURS23ASA0',
  'Seattle|WA': 'CUURS49DSA0', // uses SF-Seattle combined area
  'Austin|TX': 'CUURS37RSA0',
  'Denver|CO': 'CUURS44BSA0',
  'Portland|OR': 'CUURS49ESA0',
  'Miami|FL': 'CUURS35ASA0',
  'Nashville|TN': 'CUURS35ESA0',
  'Washington|DC': 'CUURS35ASA0', // uses South region
  'Philadelphia|PA': 'CUURS12BSA0',
};

// BLS OEWS (Occupational Employment and Wage Statistics) series IDs
// Format: OEUM{area_code}000000{occ_code}{data_type}
// area_code = MSA code, occ_code = 000000 (all occupations), data_type = 04 (median hourly) or 13 (median annual)
const WAGE_SERIES: Record<string, string> = {
  'New York|NY': 'OEUM003562000000000000004',
  'San Francisco|CA': 'OEUM004186000000000000004',
  'Los Angeles|CA': 'OEUM003108000000000000004',
  'Chicago|IL': 'OEUM001698000000000000004',
  'Seattle|WA': 'OEUM004266000000000000004',
  'Austin|TX': 'OEUM001242000000000000004',
  'Denver|CO': 'OEUM001974000000000000004',
  'Portland|OR': 'OEUM003890000000000000004',
  'Miami|FL': 'OEUM003358000000000000004',
  'Nashville|TN': 'OEUM003498000000000000004',
  'Washington|DC': 'OEUM004790000000000000004',
  'Philadelphia|PA': 'OEUM003798000000000000004',
};

type BlsApiResponse = {
  status: string;
  Results?: {
    series: {
      seriesID: string;
      data: {
        year: string;
        period: string;
        value: string;
        latest?: string;
      }[];
    }[];
  };
};

/**
 * Fetch BLS data for a batch of series IDs (up to 50 per request).
 */
async function fetchBlsSeries(
  seriesIds: string[],
): Promise<BlsApiResponse | null> {
  const apiKey = env.BLS_API_KEY;
  if (!apiKey) return null;

  try {
    const currentYear = new Date().getFullYear();
    const res = await fetch(BLS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesid: seriesIds,
        startyear: (currentYear - 2).toString(),
        endyear: currentYear.toString(),
        registrationkey: apiKey,
      }),
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch CPI and wage data for a single city/state and cache in DB.
 */
export async function fetchBlsData(
  city: string,
  state: string,
): Promise<{ cpi: BlsData | null; wage: BlsData | null }> {
  const key = `${city}|${state}`;
  const cpiSeriesId = CPI_SERIES[key];
  const wageSeriesId = WAGE_SERIES[key];

  if (!cpiSeriesId && !wageSeriesId) {
    return { cpi: null, wage: null };
  }

  const seriesIds = [cpiSeriesId, wageSeriesId].filter((id): id is string => id != null);
  const response = await fetchBlsSeries(seriesIds);

  if (!response?.Results?.series) {
    return { cpi: null, wage: null };
  }

  let cpi: BlsData | null = null;
  let wage: BlsData | null = null;

  for (const series of response.Results.series) {
    const latestDataPoint = series.data[0]; // BLS returns most recent first
    if (!latestDataPoint) continue;

    const value = parseFloat(latestDataPoint.value);
    if (isNaN(value)) continue;

    const year = parseInt(latestDataPoint.year, 10);
    const isCpi = series.seriesID === cpiSeriesId;
    const seriesType = isCpi ? 'cpi' : 'wage';
    const ttlDays = isCpi ? CPI_CACHE_TTL_DAYS : WAGE_CACHE_TTL_DAYS;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);

    const cached = await prisma.blsDataCache.upsert({
      where: { seriesId: series.seriesID },
      create: {
        seriesId: series.seriesID,
        city,
        state,
        seriesType,
        value,
        period: latestDataPoint.period,
        year,
        rawResponse: JSON.parse(JSON.stringify(series)),
        fetchedAt: now,
        expiresAt,
      },
      update: {
        value,
        period: latestDataPoint.period,
        year,
        rawResponse: JSON.parse(JSON.stringify(series)),
        fetchedAt: now,
        expiresAt,
      },
    });

    const result: BlsData = {
      seriesId: cached.seriesId,
      city: cached.city,
      state: cached.state,
      seriesType: cached.seriesType as 'cpi' | 'wage',
      value: cached.value,
      period: cached.period,
      year: cached.year,
      fetchedAt: cached.fetchedAt,
    };

    if (isCpi) {
      cpi = result;
    } else {
      wage = result;
    }
  }

  return { cpi, wage };
}

/**
 * Fetch BLS data for all mapped metro areas.
 * Batches series IDs into groups of 50 (BLS limit).
 */
export async function fetchAllBlsData(): Promise<{
  fetched: number;
  skipped: number;
  failed: number;
}> {
  if (!env.BLS_API_KEY) {
    return { fetched: 0, skipped: 0, failed: 0 };
  }

  // Get unique city/state pairs that have BLS mappings
  const neighborhoods = await prisma.neighborhood.findMany({
    select: { city: true, state: true },
    distinct: ['city', 'state'],
  });

  const now = new Date();
  const existing = await prisma.blsDataCache.findMany({
    where: { expiresAt: { gt: now } },
    select: { city: true, state: true },
  });
  const cachedKeys = new Set(existing.map((e) => `${e.city}|${e.state}`));

  let fetched = 0;
  let skipped = 0;
  let failed = 0;

  for (const n of neighborhoods) {
    const key = `${n.city}|${n.state}`;
    if (!CPI_SERIES[key] && !WAGE_SERIES[key]) {
      // No BLS mapping for this city
      continue;
    }

    if (cachedKeys.has(key)) {
      skipped++;
      continue;
    }

    const result = await fetchBlsData(n.city, n.state);
    if (result.cpi || result.wage) {
      fetched++;
    } else {
      failed++;
    }

    // Small delay between calls
    await new Promise((r) => setTimeout(r, 300));
  }

  return { fetched, skipped, failed };
}

/**
 * Read BLS CPI and wage data from DB cache for a neighborhood. No API calls.
 */
export async function getBlsData(
  neighborhoodId: string,
): Promise<{ cpi: BlsData | null; wage: BlsData | null }> {
  const neighborhood = await prisma.neighborhood.findUnique({
    where: { id: neighborhoodId },
    select: { city: true, state: true },
  });

  if (!neighborhood) return { cpi: null, wage: null };

  const key = `${neighborhood.city}|${neighborhood.state}`;
  const cpiSeriesId = CPI_SERIES[key];
  const wageSeriesId = WAGE_SERIES[key];

  if (!cpiSeriesId && !wageSeriesId) {
    return { cpi: null, wage: null };
  }

  const seriesIds = [cpiSeriesId, wageSeriesId].filter((id): id is string => id != null);

  const cached = await prisma.blsDataCache.findMany({
    where: { seriesId: { in: seriesIds } },
  });

  let cpi: BlsData | null = null;
  let wage: BlsData | null = null;

  for (const row of cached) {
    const result: BlsData = {
      seriesId: row.seriesId,
      city: row.city,
      state: row.state,
      seriesType: row.seriesType as 'cpi' | 'wage',
      value: row.value,
      period: row.period,
      year: row.year,
      fetchedAt: row.fetchedAt,
    };

    if (row.seriesId === cpiSeriesId) {
      cpi = result;
    } else {
      wage = result;
    }
  }

  return { cpi, wage };
}
