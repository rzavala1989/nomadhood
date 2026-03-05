import { prisma } from '@/server/prisma';
import { env } from '@/server/env';
import type { NeighborhoodImageData } from './types';

const CACHE_TTL_DAYS = 90;
const UNSPLASH_PER_PAGE = 10;

type ImageFetchResult = {
  source: 'unsplash' | 'wikimedia';
  imageUrl: string;
  thumbUrl: string | null;
  altText: string | null;
  photographerName: string | null;
  photographerUrl: string | null;
  pageUrl: string | null;
  unsplashDownloadUrl: string | null;
};

// --- Unsplash ---

type UnsplashPhoto = {
  id: string;
  urls: { regular: string; small: string; thumb: string };
  alt_description: string | null;
  description: string | null;
  user: { name: string; links: { html: string } };
  links: { html: string; download_location: string };
  tags?: { title: string }[];
};

type UnsplashSearchResponse = {
  total: number;
  results: UnsplashPhoto[];
};

/**
 * Search Unsplash for multiple landscape photos of a neighborhood.
 * Uses "{name} {city}" as the query to match Unsplash's tag-based search
 * (tags like "coconut grove miami", "urban", "architecture" are indexed).
 */
async function fetchFromUnsplash(
  name: string,
  city: string,
): Promise<ImageFetchResult[]> {
  const apiKey = env.UNSPLASH_ACCESS_KEY;
  if (!apiKey) return [];

  const query = `${name} ${city}`;
  const params = new URLSearchParams({
    query,
    orientation: 'landscape',
    per_page: String(UNSPLASH_PER_PAGE),
  });

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?${params}`,
      { headers: { Authorization: `Client-ID ${apiKey}` } },
    );
    if (!res.ok) return [];

    const data: UnsplashSearchResponse = await res.json();
    if (data.total === 0 || data.results.length === 0) return [];

    return data.results.map((photo) => ({
      source: 'unsplash' as const,
      imageUrl: photo.urls.regular,
      thumbUrl: photo.urls.small,
      altText: photo.alt_description ?? photo.description,
      photographerName: photo.user.name,
      photographerUrl: photo.user.links.html,
      pageUrl: photo.links.html,
      unsplashDownloadUrl: photo.links.download_location,
    }));
  } catch {
    return [];
  }
}

// --- Wikimedia Commons ---

type WikimediaImageInfo = {
  url: string;
  thumburl?: string;
  descriptionurl?: string;
  extmetadata?: {
    Artist?: { value: string };
    ImageDescription?: { value: string };
  };
};

/**
 * Geosearch Wikimedia Commons for photos near coordinates.
 * Returns up to 10 results.
 */
async function fetchFromWikimedia(
  lat: number,
  lng: number,
): Promise<ImageFetchResult[]> {
  try {
    const geoParams = new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'geosearch',
      ggscoord: `${lat}|${lng}`,
      ggsradius: '10000',
      ggsnamespace: '6',
      ggslimit: '10',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '800',
    });

    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?${geoParams}`,
    );
    if (!res.ok) return [];

    const data = await res.json();
    const pages: Record<string, { imageinfo?: WikimediaImageInfo[] }> =
      data?.query?.pages;
    if (!pages) return [];

    const results: ImageFetchResult[] = [];

    for (const page of Object.values(pages)) {
      const info = page.imageinfo?.[0];
      if (!info?.url) continue;
      if (/\.(svg|pdf)$/i.test(info.url)) continue;

      const artist = info.extmetadata?.Artist?.value?.replace(/<[^>]+>/g, '') ?? null;
      const desc = info.extmetadata?.ImageDescription?.value?.replace(/<[^>]+>/g, '') ?? null;

      results.push({
        source: 'wikimedia',
        imageUrl: info.thumburl ?? info.url,
        thumbUrl: info.thumburl ?? null,
        altText: desc,
        photographerName: artist,
        photographerUrl: null,
        pageUrl: info.descriptionurl ?? null,
        unsplashDownloadUrl: null,
      });
    }

    return results;
  } catch {
    return [];
  }
}

// --- Public API ---

function toImageData(
  row: {
    source: string;
    imageUrl: string;
    thumbUrl: string | null;
    altText: string | null;
    photographerName: string | null;
    photographerUrl: string | null;
    pageUrl: string | null;
    fetchedAt: Date;
  },
): NeighborhoodImageData {
  return {
    source: row.source as 'unsplash' | 'wikimedia',
    imageUrl: row.imageUrl,
    thumbUrl: row.thumbUrl,
    altText: row.altText,
    photographerName: row.photographerName,
    photographerUrl: row.photographerUrl,
    pageUrl: row.pageUrl,
    fetchedAt: row.fetchedAt,
  };
}

/**
 * Fetch images for a single neighborhood. Tries Unsplash first (up to 10 results),
 * falls back to Wikimedia if no Unsplash key or no results.
 * Stores all results in cache with 90-day TTL. Deduplicates by imageUrl.
 */
export async function fetchNeighborhoodImages(
  neighborhoodId: string,
): Promise<NeighborhoodImageData[]> {
  const neighborhood = await prisma.neighborhood.findUnique({
    where: { id: neighborhoodId },
    select: { name: true, city: true, latitude: true, longitude: true },
  });

  if (!neighborhood) return [];

  // Try Unsplash first
  let results = await fetchFromUnsplash(neighborhood.name, neighborhood.city);

  // Fall back to Wikimedia if Unsplash returned nothing
  if (results.length === 0 && neighborhood.latitude != null && neighborhood.longitude != null) {
    results = await fetchFromWikimedia(neighborhood.latitude, neighborhood.longitude);
  }

  if (results.length === 0) return [];

  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);

  // Upsert all results, deduped by (neighborhoodId, imageUrl)
  const stored: NeighborhoodImageData[] = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    try {
      const cached = await prisma.neighborhoodImageCache.upsert({
        where: {
          neighborhoodId_imageUrl: {
            neighborhoodId,
            imageUrl: r.imageUrl,
          },
        },
        create: {
          neighborhoodId,
          position: i,
          source: r.source,
          imageUrl: r.imageUrl,
          thumbUrl: r.thumbUrl,
          altText: r.altText,
          photographerName: r.photographerName,
          photographerUrl: r.photographerUrl,
          pageUrl: r.pageUrl,
          unsplashDownloadUrl: r.unsplashDownloadUrl,
          rawResponse: {},
          fetchedAt: now,
          expiresAt,
        },
        update: {
          position: i,
          source: r.source,
          thumbUrl: r.thumbUrl,
          altText: r.altText,
          photographerName: r.photographerName,
          photographerUrl: r.photographerUrl,
          pageUrl: r.pageUrl,
          unsplashDownloadUrl: r.unsplashDownloadUrl,
          fetchedAt: now,
          expiresAt,
        },
      });
      stored.push(toImageData(cached));
    } catch {
      // skip duplicates or DB errors for individual images
    }
  }

  return stored;
}

/**
 * Fetch images for all neighborhoods. Skips neighborhoods that already have valid cache.
 * 1.5s delay between API calls to stay under Unsplash 50 req/hr demo limit.
 */
export async function fetchAllNeighborhoodImages(): Promise<{
  fetched: number;
  skipped: number;
  failed: number;
}> {
  const neighborhoods = await prisma.neighborhood.findMany({
    select: { id: true },
  });

  // A neighborhood is "cached" if it has at least one non-expired image
  const now = new Date();
  const existing = await prisma.neighborhoodImageCache.findMany({
    where: { expiresAt: { gt: now } },
    select: { neighborhoodId: true },
    distinct: ['neighborhoodId'],
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

    const results = await fetchNeighborhoodImages(n.id);
    if (results.length > 0) {
      fetched++;
    } else {
      failed++;
    }

    // 1.5s delay to stay under Unsplash 50 req/hr demo limit
    await new Promise((r) => setTimeout(r, 1500));
  }

  return { fetched, skipped, failed };
}

/**
 * Trigger Unsplash download tracking for all Unsplash images of a neighborhood.
 * Required by Unsplash API guidelines when a user views a photo.
 */
export async function triggerUnsplashDownload(
  neighborhoodId: string,
): Promise<void> {
  const apiKey = env.UNSPLASH_ACCESS_KEY;
  if (!apiKey) return;

  const rows = await prisma.neighborhoodImageCache.findMany({
    where: { neighborhoodId, source: 'unsplash', unsplashDownloadUrl: { not: null } },
    select: { unsplashDownloadUrl: true },
  });

  // Fire download tracking for first image only (the one displayed as hero)
  const first = rows[0];
  if (!first?.unsplashDownloadUrl) return;

  try {
    await fetch(first.unsplashDownloadUrl, {
      headers: { Authorization: `Client-ID ${apiKey}` },
    });
  } catch {
    // Fire-and-forget
  }
}

/**
 * Read all cached images for a neighborhood. No API calls. Ordered by position.
 */
export async function getNeighborhoodImages(
  neighborhoodId: string,
): Promise<NeighborhoodImageData[]> {
  const rows = await prisma.neighborhoodImageCache.findMany({
    where: { neighborhoodId },
    orderBy: { position: 'asc' },
  });

  return rows.map(toImageData);
}
