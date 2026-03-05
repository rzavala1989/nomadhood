/**
 * This file contains the root router of your tRPC-backend
 */
import { createCallerFactory, publicProcedure, router } from '../trpc';
import { userRouter } from './user';
import { neighborhoodsRouter } from '@/server/routers/neighborhoodsRouter';
import { favoritesRouter } from '@/server/routers/favoritesRouter';
import { reviewsRouter } from '@/server/routers/reviewsRouter';
import { dashboardRouter } from '@/server/routers/dashboardRouter';
import { dataRouter } from '@/server/routers/dataRouter';
import { recommendationsRouter } from '@/server/routers/recommendationsRouter';
import { trendsRouter } from '@/server/routers/trendsRouter';

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'yay!'),

  dashboard: dashboardRouter,
  data: dataRouter,
  user: userRouter,
  neighborhoods: neighborhoodsRouter,
  reviews: reviewsRouter,
  favorites: favoritesRouter,
  recommendations: recommendationsRouter,
  trends: trendsRouter,
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
