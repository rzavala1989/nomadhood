import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '@/server/trpc';
import { getNeighborhoodNews, getNeighborhoodPulse, getNewsTrending } from '@/server/services/newsdata';
import { prisma } from '@/server/prisma';

const SIGNAL_LABELS: Record<string, string> = {
  negative: 'Risk Signal',
  neutral: 'Local News',
  positive: 'Opportunity',
};

export const newsRouter = router({
  getByNeighborhood: publicProcedure
    .input(z.object({ neighborhoodId: z.string().uuid() }))
    .query(async ({ input }) => {
      const articles = await getNeighborhoodNews(input.neighborhoodId);

      return articles.map((article) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        sentiment: article.sentiment,
        aiTag: article.aiTag,
        pubDate: article.pubDate,
        sourceId: article.sourceId,
        signalLabel: SIGNAL_LABELS[article.sentiment ?? 'neutral'] ?? SIGNAL_LABELS.neutral,
      }));
    }),

  getPulse: publicProcedure
    .input(z.object({ neighborhoodId: z.string().uuid() }))
    .query(async ({ input }) => {
      return getNeighborhoodPulse(input.neighborhoodId);
    }),

  getTrending: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }).default({}))
    .query(async ({ input }) => {
      return getNewsTrending(input.limit);
    }),

  getAlerts: protectedProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().default(false),
        limit: z.number().min(1).max(50).default(10),
      }).default({}),
    )
    .query(async ({ ctx, input }) => {
      return prisma.newsAlert.findMany({
        where: {
          userId: ctx.user.id,
          ...(input.unreadOnly ? { isRead: false } : {}),
        },
        include: {
          neighborhood: {
            select: { id: true, name: true, city: true, state: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      });
    }),

  markRead: protectedProcedure
    .input(z.object({ alertIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      await prisma.newsAlert.updateMany({
        where: {
          id: { in: input.alertIds },
          userId: ctx.user.id,
        },
        data: { isRead: true },
      });
      return { success: true };
    }),

  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const count = await prisma.newsAlert.count({
        where: {
          userId: ctx.user.id,
          isRead: false,
        },
      });
      return { count };
    }),
});
