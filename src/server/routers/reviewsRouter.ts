import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  router,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from '@/server/trpc';
import { prisma } from '@/server/prisma';

const createReviewSchema = z.object({
  neighborhoodId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1).max(1000).optional(),
});

const updateReviewSchema = z.object({
  id: z.string().uuid(),
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().min(1).max(1000).optional(),
});

export const reviewsRouter = router({
  /**
   * Get reviews for a neighborhood with pagination
   */
  getByNeighborhood: publicProcedure
    .input(
      z.object({
        neighborhoodId: z.string().uuid(),
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const { neighborhoodId, limit, offset } = input;

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { neighborhoodId },
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
          take: limit,
          skip: offset,
        }),
        prisma.review.count({ where: { neighborhoodId } }),
      ]);

      return {
        reviews,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }),

  /**
   * Get user's review for a specific neighborhood
   */
  getUserReview: protectedProcedure
    .input(z.object({ neighborhoodId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      prisma.review.findUnique({
        where: {
          userId_neighborhoodId: {
            userId: ctx.user.id,
            neighborhoodId: input.neighborhoodId,
          },
        },
      })
    ),

  /**
   * Create a new review
   */
  create: protectedProcedure
    .input(createReviewSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if neighborhood exists
      const neighborhood = await prisma.neighborhood.findUnique({
        where: { id: input.neighborhoodId },
      });

      if (!neighborhood) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Neighborhood not found',
        });
      }

      // Check if user already reviewed this neighborhood
      const existingReview = await prisma.review.findUnique({
        where: {
          userId_neighborhoodId: {
            userId: ctx.user.id,
            neighborhoodId: input.neighborhoodId,
          },
        },
      });

      if (existingReview) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You have already reviewed this neighborhood',
        });
      }

      return prisma.review.create({
        data: {
          ...input,
          userId: ctx.user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          neighborhood: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }),

  /**
   * Update user's review
   */
  update: protectedProcedure
    .input(updateReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Check if review exists and belongs to user
      const existingReview = await prisma.review.findUnique({
        where: { id },
      });

      if (!existingReview) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Review not found',
        });
      }

      if (existingReview.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own reviews',
        });
      }

      return prisma.review.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
    }),

  /**
   * Delete user's review
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if review exists and belongs to user
      const existingReview = await prisma.review.findUnique({
        where: { id: input.id },
      });

      if (!existingReview) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Review not found',
        });
      }

      if (existingReview.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own reviews',
        });
      }

      await prisma.review.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Admin: Delete any review
   */
  adminDelete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const existingReview = await prisma.review.findUnique({
        where: { id: input.id },
      });

      if (!existingReview) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Review not found',
        });
      }

      await prisma.review.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get neighborhood statistics
   */
  getStats: publicProcedure
    .input(z.object({ neighborhoodId: z.string().uuid() }))
    .query(async ({ input }) => {
      const reviews = await prisma.review.findMany({
        where: { neighborhoodId: input.neighborhoodId },
        select: { rating: true },
      });

      if (reviews.length === 0) {
        return {
          totalReviews: 0,
          averageRating: null,
          ratingDistribution: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          },
        };
      }

      const totalReviews = reviews.length;
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
      
      const ratingDistribution = reviews.reduce(
        (acc, review) => {
          acc[review.rating as keyof typeof acc]++;
          return acc;
        },
        { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      );

      return {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        ratingDistribution,
      };
    }),
});
