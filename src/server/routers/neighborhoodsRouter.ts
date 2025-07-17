import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  router,
  publicProcedure,
  adminProcedure,
} from '@/server/trpc';
import { prisma } from '@/server/prisma';

export const neighborhoodsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        city: z.string().optional(),
        state: z.string().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ input = {} }) => {
      const { limit, offset, city, state, search } = input;

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

      const [neighborhoods, total] = await Promise.all([
        prisma.neighborhood.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          include: {
            _count: {
              select: {
                reviews: true,
                favorites: true,
              },
            },
          },
        }),
        prisma.neighborhood.count({ where }),
      ]);

      return {
        neighborhoods,
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
      const neighborhood = await prisma.neighborhood.findUnique({
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
      });

      if (!neighborhood) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Neighborhood not found',
        });
      }

      // Calculate average rating
      const avgRating = neighborhood.reviews.length > 0
        ? neighborhood.reviews.reduce((sum, review) => sum + review.rating, 0) / neighborhood.reviews.length
        : null;

      return {
        ...neighborhood,
        avgRating,
      };
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
        description: z.string().optional(),
      }),
    )
    .mutation(({ input }) =>
      prisma.neighborhood.create({
        data: input,
      }),
    ),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
        description: z.string().optional(),
      }),
    )
    .mutation(({ input }) =>
      prisma.neighborhood.update({
        where: { id: input.id },
        data: input,
      }),
    ),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ input }) =>
      prisma.neighborhood.delete({
        where: { id: input.id },
      }),
    ),
});
