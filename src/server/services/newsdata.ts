import { prisma } from '@/server/prisma';
import { env } from '@/server/env';
import { classifyArticle, type NomadSignalCategory } from '@/server/constants/newsCategories';

const NEWSDATA_BASE_URL = 'https://newsdata.io/api/1/latest';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const DAILY_CALL_WARN_THRESHOLD = 150;

// Simple in-memory daily call counter (resets on process restart)
let dailyCallCount = 0;
let dailyCallDate = new Date().toISOString().slice(0, 10);

function incrementCallCount() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== dailyCallDate) {
    dailyCallCount = 0;
    dailyCallDate = today;
  }
  dailyCallCount++;
  if (dailyCallCount > DAILY_CALL_WARN_THRESHOLD) {
    console.warn(
      `[newsdata] Daily API call count (${dailyCallCount}) exceeds ${DAILY_CALL_WARN_THRESHOLD}. ` +
      'Free tier limit is 200/day.',
    );
  }
}

interface NewsdataArticle {
  article_id: string;
  title: string;
  description: string | null;
  link: string;
  source_id: string | null;
  sentiment: string | null;
  category: string[];
  ai_tag: string[] | null;
  pubDate: string;
}

interface NewsdataResponse {
  status: string;
  totalResults: number;
  results: NewsdataArticle[];
}

function buildQueryUrl(name: string, city: string): string {
  const qParts = [
    `${name} ${city}`,
    `"${name} neighborhood"`,
    `"${city} ${name}"`,
  ];
  const qInTitle = qParts.join(' OR ');

  const params = new URLSearchParams({
    apikey: env.NEWSDATA_IO_API_KEY!,
    qInTitle,
    country: 'us',
    language: 'en',
    category: 'top,crime,environment,business,politics',
    tag: 'Real Estate,Housing,Urban Development,Crime,Public Safety,Transportation,Cost of Living',
    sentiment: 'negative,neutral,positive',
    full_content: '0',
    size: '10',
    prioritydomain: 'top',
  });

  return `${NEWSDATA_BASE_URL}?${params.toString()}`;
}

export async function getNeighborhoodNews(neighborhoodId: string) {
  // Look up neighborhood
  const neighborhood = await prisma.neighborhood.findUnique({
    where: { id: neighborhoodId },
    select: { id: true, name: true, city: true },
  });

  if (!neighborhood) return [];

  // Check cache: articles fetched within last 6 hours
  const cacheThreshold = new Date(Date.now() - CACHE_TTL_MS);
  const cachedCount = await prisma.neighborhoodNews.count({
    where: {
      neighborhoodId,
      fetchedAt: { gt: cacheThreshold },
    },
  });

  if (cachedCount > 0) {
    return prisma.neighborhoodNews.findMany({
      where: { neighborhoodId },
      orderBy: { pubDate: 'desc' },
      take: 10,
    });
  }

  // No fresh cache, call API
  if (!env.NEWSDATA_IO_API_KEY) {
    return getCachedArticles(neighborhoodId);
  }

  try {
    incrementCallCount();

    const url = buildQueryUrl(neighborhood.name, neighborhood.city);
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[newsdata] API returned ${response.status} for ${neighborhood.name}, ${neighborhood.city}`);
      return getCachedArticles(neighborhoodId);
    }

    const data = (await response.json()) as NewsdataResponse;

    if (!data.results || data.results.length === 0) {
      return getCachedArticles(neighborhoodId);
    }

    // Upsert articles, skip duplicates
    for (const article of data.results) {
      if (!article.article_id || !article.title) continue;

      await prisma.neighborhoodNews.upsert({
        where: { articleId: article.article_id },
        update: {
          title: article.title,
          description: article.description ?? null,
          url: article.link,
          sourceId: article.source_id ?? null,
          sentiment: article.sentiment ?? null,
          category: article.category ?? [],
          aiTag: article.ai_tag ?? [],
          pubDate: new Date(article.pubDate),
          fetchedAt: new Date(),
        },
        create: {
          neighborhoodId,
          articleId: article.article_id,
          title: article.title,
          description: article.description ?? null,
          url: article.link,
          sourceId: article.source_id ?? null,
          sentiment: article.sentiment ?? null,
          category: article.category ?? [],
          aiTag: article.ai_tag ?? [],
          pubDate: new Date(article.pubDate),
        },
      });
    }

    return prisma.neighborhoodNews.findMany({
      where: { neighborhoodId },
      orderBy: { pubDate: 'desc' },
      take: 10,
    });
  } catch (err) {
    console.error('[newsdata] Fetch error:', err);
    return getCachedArticles(neighborhoodId);
  }
}

async function getCachedArticles(neighborhoodId: string) {
  return prisma.neighborhoodNews.findMany({
    where: { neighborhoodId },
    orderBy: { pubDate: 'desc' },
    take: 10,
  });
}

export interface PulseArticle {
  id: string;
  title: string;
  description: string | null;
  url: string;
  sourceId: string | null;
  sentiment: string | null;
  pubDate: Date;
  signals: NomadSignalCategory[];
}

export interface PulseResult {
  articles: Record<string, PulseArticle[]>;
  sentimentScore: number;
  trendDirection: 'improving' | 'declining' | 'stable';
  trendMagnitude: number;
  articleCount: number;
}

function sentimentValue(s: string | null): number {
  if (s === 'positive') return 1;
  if (s === 'negative') return -1;
  return 0;
}

export async function getNeighborhoodPulse(neighborhoodId: string): Promise<PulseResult> {
  // Refresh cache
  await getNeighborhoodNews(neighborhoodId);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const allArticles = await prisma.neighborhoodNews.findMany({
    where: { neighborhoodId, pubDate: { gte: thirtyDaysAgo } },
    orderBy: { pubDate: 'desc' },
  });

  if (allArticles.length === 0) {
    return {
      articles: {},
      sentimentScore: 0,
      trendDirection: 'stable',
      trendMagnitude: 0,
      articleCount: 0,
    };
  }

  // Classify and group
  const grouped: Record<string, PulseArticle[]> = {};
  const classified: PulseArticle[] = allArticles.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    url: a.url,
    sourceId: a.sourceId,
    sentiment: a.sentiment,
    pubDate: a.pubDate,
    signals: classifyArticle(a.category, a.aiTag),
  }));

  for (const article of classified.slice(0, 10)) {
    for (const signal of article.signals) {
      if (!grouped[signal]) grouped[signal] = [];
      grouped[signal].push(article);
    }
  }

  // Sentiment score: avg across all 30d articles
  const sentimentScore =
    allArticles.reduce((sum, a) => sum + sentimentValue(a.sentiment), 0) /
    allArticles.length;

  // Sentiment velocity: 7d avg vs 8-30d avg
  const recent = allArticles.filter((a) => a.pubDate >= sevenDaysAgo);
  const older = allArticles.filter((a) => a.pubDate < sevenDaysAgo);

  const recentAvg = recent.length > 0
    ? recent.reduce((s, a) => s + sentimentValue(a.sentiment), 0) / recent.length
    : 0;
  const olderAvg = older.length > 0
    ? older.reduce((s, a) => s + sentimentValue(a.sentiment), 0) / older.length
    : 0;

  const velocity = recentAvg - olderAvg;
  const trendDirection: PulseResult['trendDirection'] =
    velocity > 0.1 ? 'improving' : velocity < -0.1 ? 'declining' : 'stable';

  return {
    articles: grouped,
    sentimentScore: Math.round(sentimentScore * 100) / 100,
    trendDirection,
    trendMagnitude: Math.round(Math.abs(velocity) * 100) / 100,
    articleCount: allArticles.length,
  };
}

export interface TrendingNeighborhood {
  neighborhoodId: string;
  name: string;
  city: string;
  state: string;
  velocity: number;
  score: number;
  articleCount7d: number;
  articleCount30d: number;
}

export interface TrendingResult {
  heatingUp: TrendingNeighborhood[];
  coolingDown: TrendingNeighborhood[];
}

export async function getNewsTrending(limit = 5): Promise<TrendingResult> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const allArticles = await prisma.neighborhoodNews.findMany({
    where: { pubDate: { gte: thirtyDaysAgo } },
    select: {
      neighborhoodId: true,
      sentiment: true,
      pubDate: true,
    },
  });

  // Group by neighborhood
  const byNeighborhood = new Map<string, typeof allArticles>();
  for (const a of allArticles) {
    const list = byNeighborhood.get(a.neighborhoodId) ?? [];
    list.push(a);
    byNeighborhood.set(a.neighborhoodId, list);
  }

  const candidates: {
    neighborhoodId: string;
    velocity: number;
    positiveRatio: number;
    negativeRatio: number;
    count7d: number;
    count30d: number;
  }[] = [];

  for (const [nId, articles] of byNeighborhood) {
    if (articles.length < 2) continue;

    const recent = articles.filter((a) => a.pubDate >= sevenDaysAgo);
    const count7d = recent.length;
    const count30d = articles.length;
    const velocity = count30d > 0 ? (count7d / 7) / (count30d / 30) : 0;

    const positiveRatio = count7d > 0
      ? recent.filter((a) => a.sentiment === 'positive').length / count7d
      : 0;
    const negativeRatio = count7d > 0
      ? recent.filter((a) => a.sentiment === 'negative').length / count7d
      : 0;

    candidates.push({
      neighborhoodId: nId,
      velocity,
      positiveRatio,
      negativeRatio,
      count7d,
      count30d,
    });
  }

  // Heating up: high velocity * positive ratio
  const heatingCandidates = candidates
    .map((c) => ({ ...c, score: c.velocity * c.positiveRatio }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Cooling down: high velocity * negative ratio
  const coolingCandidates = candidates
    .map((c) => ({ ...c, score: c.velocity * c.negativeRatio }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Lookup neighborhood names
  const neighborhoodIds = [
    ...new Set([
      ...heatingCandidates.map((c) => c.neighborhoodId),
      ...coolingCandidates.map((c) => c.neighborhoodId),
    ]),
  ];

  const neighborhoods = await prisma.neighborhood.findMany({
    where: { id: { in: neighborhoodIds } },
    select: { id: true, name: true, city: true, state: true },
  });

  const nMap = new Map(neighborhoods.map((n) => [n.id, n]));

  function toResult(c: (typeof heatingCandidates)[number]): TrendingNeighborhood | null {
    const n = nMap.get(c.neighborhoodId);
    if (!n) return null;
    return {
      neighborhoodId: c.neighborhoodId,
      name: n.name,
      city: n.city,
      state: n.state,
      velocity: Math.round(c.velocity * 100) / 100,
      score: Math.round(c.score * 100) / 100,
      articleCount7d: c.count7d,
      articleCount30d: c.count30d,
    };
  }

  return {
    heatingUp: heatingCandidates.map(toResult).filter(Boolean) as TrendingNeighborhood[],
    coolingDown: coolingCandidates.map(toResult).filter(Boolean) as TrendingNeighborhood[],
  };
}
