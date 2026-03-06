import { prisma } from '@/server/prisma';
import { getNeighborhoodNews } from '@/server/services/newsdata';

const MAX_NEIGHBORHOODS_PER_RUN = 30;
const ALERT_RETENTION_DAYS = 90;

export async function generateNewsAlerts() {
  // 1. Fetch all favorites grouped by neighborhoodId
  const favorites = await prisma.favorite.findMany({
    select: { userId: true, neighborhoodId: true },
  });

  // Group: neighborhoodId -> userId[]
  const byNeighborhood = new Map<string, string[]>();
  for (const fav of favorites) {
    const users = byNeighborhood.get(fav.neighborhoodId) ?? [];
    users.push(fav.userId);
    byNeighborhood.set(fav.neighborhoodId, users);
  }

  // Prioritize by favorite count (most-favorited first)
  const sorted = [...byNeighborhood.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, MAX_NEIGHBORHOODS_PER_RUN);

  // 2. Refresh news for favorited neighborhoods
  let newsRefreshed = 0;
  for (const [neighborhoodId] of sorted) {
    await getNeighborhoodNews(neighborhoodId);
    newsRefreshed++;
  }

  // 3. Query negative articles in last 7 days for those neighborhoods
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const neighborhoodIds = sorted.map(([id]) => id);

  const negativeArticles = await prisma.neighborhoodNews.findMany({
    where: {
      neighborhoodId: { in: neighborhoodIds },
      sentiment: 'negative',
      pubDate: { gte: sevenDaysAgo },
    },
    select: {
      id: true,
      neighborhoodId: true,
      title: true,
    },
  });

  // Group negatives by neighborhood
  const negativeByNeighborhood = new Map<string, typeof negativeArticles>();
  for (const article of negativeArticles) {
    const list = negativeByNeighborhood.get(article.neighborhoodId) ?? [];
    list.push(article);
    negativeByNeighborhood.set(article.neighborhoodId, list);
  }

  // 4. Generate alerts for neighborhoods with 3+ negatives
  let alertsGenerated = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const [neighborhoodId, articles] of negativeByNeighborhood) {
    if (articles.length < 3) continue;

    const severity = articles.length >= 5 ? 'high' : 'medium';
    const userIds = byNeighborhood.get(neighborhoodId) ?? [];
    const articleIds = articles.map((a) => a.id);

    // Get neighborhood name for alert title
    const neighborhood = await prisma.neighborhood.findUnique({
      where: { id: neighborhoodId },
      select: { name: true, city: true },
    });

    if (!neighborhood) continue;

    const title = `${articles.length} negative reports in ${neighborhood.name}`;
    const summary = articles
      .slice(0, 3)
      .map((a) => a.title)
      .join('; ');

    for (const userId of userIds) {
      await prisma.newsAlert.upsert({
        where: {
          userId_neighborhoodId_alertType_triggerDate: {
            userId,
            neighborhoodId,
            alertType: 'negative_spike',
            triggerDate: today,
          },
        },
        update: {
          triggerArticleIds: articleIds,
          title,
          summary,
          severity,
        },
        create: {
          userId,
          neighborhoodId,
          alertType: 'negative_spike',
          triggerArticleIds: articleIds,
          title,
          summary,
          severity,
          triggerDate: today,
        },
      });
      alertsGenerated++;
    }
  }

  // 5. Cleanup old alerts
  const retentionThreshold = new Date(Date.now() - ALERT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.newsAlert.deleteMany({
    where: { createdAt: { lt: retentionThreshold } },
  });

  return {
    alertsGenerated,
    neighborhoodsScanned: sorted.length,
    newsRefreshed,
  };
}
