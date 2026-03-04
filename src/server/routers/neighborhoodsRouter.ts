import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  router,
  publicProcedure,
  adminProcedure,
} from '@/server/trpc';
import { prisma } from '@/server/prisma';
import { calculateAvgRating, calculateNomadScore } from '@/server/utils/scores';
import { getMaxCounts } from '@/server/utils/queries';

const createNeighborhoodSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  city: z.string().min(1, 'City is required').max(50, 'City name too long'),
  state: z.string().length(2, 'State must be 2 characters').toUpperCase(),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  description: z.string().max(1000, 'Description too long').optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

const updateNeighborhoodSchema = createNeighborhoodSchema.partial().extend({
  id: z.string().uuid(),
});

export const neighborhoodsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        city: z.string().optional(),
        state: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.enum([
          'newest',
          'oldest',
          'name_asc',
          'name_desc',
          'most_reviews',
          'most_favorites',
        ]).default('newest'),
      }).optional()
    )
    .query(async ({ input }) => {
      const { limit = 20, offset = 0, city, state, search, sortBy = 'newest' } = input ?? {};

      const where = {
        ...(city && { city: { contains: city, mode: 'insensitive' as const } }),
        ...(state && { state: { contains: state, mode: 'insensitive' as const } }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      const orderByMap: Record<string, object> = {
        newest: { createdAt: 'desc' as const },
        oldest: { createdAt: 'asc' as const },
        name_asc: { name: 'asc' as const },
        name_desc: { name: 'desc' as const },
        most_reviews: { reviews: { _count: 'desc' as const } },
        most_favorites: { favorites: { _count: 'desc' as const } },
      };

      const [neighborhoods, total, { maxReviews, maxFavorites }] = await Promise.all([
        prisma.neighborhood.findMany({
          where,
          orderBy: orderByMap[sortBy],
          take: limit,
          skip: offset,
          include: {
            _count: { select: { reviews: true, favorites: true } },
            reviews: { select: { rating: true } },
          },
        }),
        prisma.neighborhood.count({ where }),
        getMaxCounts(),
      ]);

      const neighborhoodsWithScore = neighborhoods.map((n) => {
        const avgRating = calculateAvgRating(n.reviews) ?? 0;
        const nomadScore = calculateNomadScore(avgRating, n._count.reviews, n._count.favorites, maxReviews, maxFavorites);
        const { reviews: _reviews, ...rest } = n;
        return { ...rest, avgRating, nomadScore };
      });

      return {
        neighborhoods: neighborhoodsWithScore,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const [neighborhood, { maxReviews, maxFavorites }] = await Promise.all([
        prisma.neighborhood.findUnique({
          where: { id: input.id },
          include: {
            reviews: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
            _count: {
              select: {
                reviews: true,
                favorites: true,
              },
            },
          },
        }),
        getMaxCounts(),
      ]);

      if (!neighborhood) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Neighborhood not found',
        });
      }

      const avgRating = calculateAvgRating(neighborhood.reviews);
      const nomadScore = calculateNomadScore(avgRating, neighborhood._count.reviews, neighborhood._count.favorites, maxReviews, maxFavorites);

      return {
        ...neighborhood,
        avgRating,
        nomadScore,
      };
    }),

  create: adminProcedure
    .input(createNeighborhoodSchema)
    .mutation(({ input }) =>
      prisma.neighborhood.create({
        data: input,
      }),
    ),

  update: adminProcedure
    .input(updateNeighborhoodSchema)
    .mutation(({ input }) => {
      const { id, ...updateData } = input;
      return prisma.neighborhood.update({
        where: { id },
        data: updateData,
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ input }) =>
      prisma.neighborhood.delete({
        where: { id: input.id },
      }),
    ),

  getWithScores: publicProcedure
    .query(async () => {
      const [neighborhoods, { maxReviews, maxFavorites }] = await Promise.all([
        prisma.neighborhood.findMany({
          include: {
            _count: { select: { reviews: true, favorites: true } },
            reviews: { select: { rating: true } },
          },
        }),
        getMaxCounts(),
      ]);

      const scores: Record<string, number> = {};
      for (const n of neighborhoods) {
        const avgRating = calculateAvgRating(n.reviews) ?? 0;
        scores[n.id] = calculateNomadScore(avgRating, n._count.reviews, n._count.favorites, maxReviews, maxFavorites);
      }

      return scores;
    }),

  getSimilar: publicProcedure
    .input(z.object({ id: z.string().uuid(), limit: z.number().min(1).max(10).default(4) }))
    .query(async ({ input }) => {
      const neighborhood = await prisma.neighborhood.findUnique({
        where: { id: input.id },
        select: { city: true, state: true },
      });

      if (!neighborhood) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Neighborhood not found' });
      }

      return prisma.neighborhood.findMany({
        where: {
          id: { not: input.id },
          OR: [
            { city: neighborhood.city, state: neighborhood.state },
            { state: neighborhood.state },
          ],
        },
        take: input.limit,
        include: {
          _count: { select: { reviews: true, favorites: true } },
        },
      });
    }),
});
