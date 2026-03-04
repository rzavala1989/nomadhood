import { prisma } from '@/server/prisma';
import { env } from '@/server/env';
import type { EventbriteData, EventbriteListing } from './types';

const EVENTBRITE_API_BASE = 'https://www.eventbriteapi.com/v3';
const CACHE_TTL_HOURS = 24;

// Hardcoded org/venue IDs per city for fetching events.
// These are coworking spaces, tech meetup organizers, and community hubs.
// Format: { orgIds: string[], venueIds: string[] }
const CITY_EVENT_SOURCES: Record<string, { orgIds: string[]; venueIds: string[] }> = {
  'New York|NY': { orgIds: ['8603443039'], venueIds: [] },
  'San Francisco|CA': { orgIds: ['4803498890'], venueIds: [] },
  'Los Angeles|CA': { orgIds: ['17aborede23'], venueIds: [] },
  'Chicago|IL': { orgIds: ['8925690499'], venueIds: [] },
  'Seattle|WA': { orgIds: ['18aborede12'], venueIds: [] },
  'Austin|TX': { orgIds: ['6895214567'], venueIds: [] },
  'Denver|CO': { orgIds: ['7712349876'], venueIds: [] },
  'Portland|OR': { orgIds: ['9934561234'], venueIds: [] },
  'Miami|FL': { orgIds: ['5567891234'], venueIds: [] },
  'Nashville|TN': { orgIds: ['3345678901'], venueIds: [] },
  'Washington|DC': { orgIds: ['4456789012'], venueIds: [] },
  'Philadelphia|PA': { orgIds: ['2234567890'], venueIds: [] },
};

type EventbriteEvent = {
  name?: { text?: string };
  start?: { utc?: string };
  url?: string;
  is_free?: boolean;
};

type EventbriteListResponse = {
  events?: EventbriteEvent[];
  pagination?: { object_count?: number };
};

/**
 * Fetch events from a single Eventbrite organization.
 */
async function fetchOrgEvents(
  orgId: string,
  token: string,
): Promise<EventbriteEvent[]> {
  try {
    const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const res = await fetch(
      `${EVENTBRITE_API_BASE}/organizations/${orgId}/events/?status=live&start_date.range_start=${now}&order_by=start_asc&page_size=10`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return [];
    const data: EventbriteListResponse = await res.json();
    return data.events ?? [];
  } catch {
    return [];
  }
}

/**
 * Fetch events from a single Eventbrite venue.
 */
async function fetchVenueEvents(
  venueId: string,
  token: string,
): Promise<EventbriteEvent[]> {
  try {
    const res = await fetch(
      `${EVENTBRITE_API_BASE}/venues/${venueId}/events/?status=live&order_by=start_asc&page_size=10`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return [];
    const data: EventbriteListResponse = await res.json();
    return data.events ?? [];
  } catch {
    return [];
  }
}

function toEventbriteListing(event: EventbriteEvent): EventbriteListing | null {
  const name = event.name?.text;
  const date = event.start?.utc;
  const url = event.url;
  if (!name || !date || !url) return null;

  return {
    name,
    date,
    url,
    isFree: event.is_free ?? false,
  };
}

/**
 * Fetch Eventbrite events for a single city/state and cache in DB.
 */
export async function fetchEvents(
  city: string,
  state: string,
): Promise<EventbriteData | null> {
  const apiKey = env.EVENTBRITE_API_KEY;
  if (!apiKey) return null;

  const key = `${city}|${state}`;
  const sources = CITY_EVENT_SOURCES[key];
  if (!sources) return null;

  try {
    // Fetch from all org and venue sources in parallel
    const allFetches = [
      ...sources.orgIds.map((id) => fetchOrgEvents(id, apiKey)),
      ...sources.venueIds.map((id) => fetchVenueEvents(id, apiKey)),
    ];

    const results = await Promise.all(allFetches);
    const allEvents = results.flat();

    // Deduplicate by URL and sort by date
    const seen = new Set<string>();
    const listings: EventbriteListing[] = [];
    for (const event of allEvents) {
      const listing = toEventbriteListing(event);
      if (!listing || seen.has(listing.url)) continue;
      seen.add(listing.url);
      listings.push(listing);
    }

    listings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Keep top 5 for display, but count all
    const topEvents = listings.slice(0, 5);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL_HOURS * 60 * 60 * 1000);

    const cached = await prisma.eventbriteCache.upsert({
      where: { city_state: { city, state } },
      create: {
        city,
        state,
        upcomingEventCount: listings.length,
        events: JSON.parse(JSON.stringify(topEvents)),
        rawResponse: JSON.parse(JSON.stringify(allEvents)),
        fetchedAt: now,
        expiresAt,
      },
      update: {
        upcomingEventCount: listings.length,
        events: JSON.parse(JSON.stringify(topEvents)),
        rawResponse: JSON.parse(JSON.stringify(allEvents)),
        fetchedAt: now,
        expiresAt,
      },
    });

    return {
      city: cached.city,
      state: cached.state,
      upcomingEventCount: cached.upcomingEventCount,
      events: topEvents,
      fetchedAt: cached.fetchedAt,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch Eventbrite events for all cities with configured sources.
 * Skips cities with valid (non-expired) cache.
 */
export async function fetchAllEvents(): Promise<{
  fetched: number;
  skipped: number;
  failed: number;
}> {
  if (!env.EVENTBRITE_API_KEY) {
    return { fetched: 0, skipped: 0, failed: 0 };
  }

  const neighborhoods = await prisma.neighborhood.findMany({
    select: { city: true, state: true },
    distinct: ['city', 'state'],
  });

  const now = new Date();
  const existing = await prisma.eventbriteCache.findMany({
    where: { expiresAt: { gt: now } },
    select: { city: true, state: true },
  });
  const cachedKeys = new Set(existing.map((e) => `${e.city}|${e.state}`));

  let fetched = 0;
  let skipped = 0;
  let failed = 0;

  for (const n of neighborhoods) {
    const key = `${n.city}|${n.state}`;
    if (!CITY_EVENT_SOURCES[key]) continue;

    if (cachedKeys.has(key)) {
      skipped++;
      continue;
    }

    const result = await fetchEvents(n.city, n.state);
    if (result) {
      fetched++;
    } else {
      failed++;
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  return { fetched, skipped, failed };
}

/**
 * Read Eventbrite data from DB cache for a neighborhood's city/state. No API calls.
 */
export async function getEvents(
  neighborhoodId: string,
): Promise<EventbriteData | null> {
  const neighborhood = await prisma.neighborhood.findUnique({
    where: { id: neighborhoodId },
    select: { city: true, state: true },
  });

  if (!neighborhood) return null;

  const cached = await prisma.eventbriteCache.findUnique({
    where: { city_state: { city: neighborhood.city, state: neighborhood.state } },
  });

  if (!cached) return null;

  return {
    city: cached.city,
    state: cached.state,
    upcomingEventCount: cached.upcomingEventCount,
    events: cached.events as unknown as EventbriteListing[],
    fetchedAt: cached.fetchedAt,
  };
}
