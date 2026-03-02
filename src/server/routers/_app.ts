/**
 * This file contains the root router of your tRPC-backend
 */
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
  user: userRouter,
  neighborhoods: neighborhoodsRouter,
  reviews: reviewsRouter,
  favorites: favoritesRouter,
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
