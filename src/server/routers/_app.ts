/**
 * This file contains the root router of your tRPC-backend
 */
import { z } from 'zod';
import { createCallerFactory, publicProcedure, router } from '../trpc';
import { userRouter } from './user';
import { neighborhoodsRouter } from '@/server/routers/neighborhoodsRouter';
import { favoritesRouter } from '@/server/routers/favoritesRouter';
import { reviewsRouter } from '@/server/routers/reviewsRouter';
import { prisma } from '@/server/prisma';

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'yay!'),

  getDashboardStats: publicProcedure.query(async () => {
    const [userCount, neighborhoodCount, reviewCount, favoriteCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.neighborhood.count(),
        prisma.review.count(),
        prisma.favorite.count(),
      ]);
    return { userCount, neighborhoodCount, reviewCount, favoriteCount };
  }),

  getRecentActivity: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit ?? 20;
      return prisma.review.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, image: true } },
          neighborhood: { select: { id: true, name: true, city: true, state: true } },
        },
      });
    }),

  getTopNeighborhoods: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit ?? 10;
      const neighborhoods = await prisma.neighborhood.findMany({
        include: {
          reviews: { select: { rating: true } },
          _count: { select: { reviews: true, favorites: true } },
        },
      });

      return neighborhoods
        .filter((n) => n._count.reviews >= 1)
        .map((n) => ({
          id: n.id,
          name: n.name,
          city: n.city,
          state: n.state,
          avgRating:
            n.reviews.reduce((sum, r) => sum + r.rating, 0) / n.reviews.length,
          reviewCount: n._count.reviews,
          favoriteCount: n._count.favorites,
        }))
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, limit);
    }),

  getReviewTrend: publicProcedure.query(async () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const reviews = await prisma.review.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, number> = {};
    for (const r of reviews) {
      const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, '0')}`;
      grouped[key] = (grouped[key] ?? 0) + 1;
    }

    // Fill in missing months
    const result: { month: string; count: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      result.push({ month: label, count: grouped[key] ?? 0 });
    }

    return result;
  }),

  user: userRouter,
  neighborhoods: neighborhoodsRouter,
  reviews: reviewsRouter,
  favorites: favoritesRouter,
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
