import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  router,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from '@/server/trpc';
import { prisma } from '@/server/prisma';
import { calculateAvgRating } from '@/server/utils/scores';
import { REVIEW_DIMENSIONS } from '@/server/constants/dimensions';

const dimensionSchema = z.object({
  dimension: z.enum(REVIEW_DIMENSIONS),
  rating: z.number().min(1).max(5),
});

const createReviewSchema = z.object({
  neighborhoodId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1).max(1000).optional(),
  dimensions: z.array(dimensionSchema).optional(),
});

const updateReviewSchema = z.object({
  id: z.string().uuid(),
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().min(1).max(1000).optional(),
  dimensions: z.array(dimensionSchema).optional(),
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
            dimensions: true,
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
        include: { dimensions: true },
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

      const { dimensions, ...reviewData } = input;

      const review = await prisma.$transaction(async (tx) => {
        const created = await tx.review.create({
          data: {
            ...reviewData,
            userId: ctx.user.id,
          },
          include: {
            user: { select: { id: true, name: true, image: true } },
            neighborhood: { select: { id: true, name: true } },
          },
        });

        if (dimensions && dimensions.length > 0) {
          await tx.reviewDimension.createMany({
            data: dimensions.map((d) => ({
              reviewId: created.id,
              dimension: d.dimension,
              rating: d.rating,
            })),
          });
        }

        return tx.review.findUniqueOrThrow({
          where: { id: created.id },
          include: {
            user: { select: { id: true, name: true, image: true } },
            neighborhood: { select: { id: true, name: true } },
            dimensions: true,
          },
        });
      });

      // Invalidate recommendation cache for this user
      await prisma.recommendationCache.deleteMany({
        where: { userId: ctx.user.id },
      }).catch(() => { /* noop */ });

      return review;
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

      const { dimensions, ...restData } = updateData;

      const review = await prisma.$transaction(async (tx) => {
        const updated = await tx.review.update({
          where: { id },
          data: restData,
        });

        if (dimensions !== undefined) {
          await tx.reviewDimension.deleteMany({ where: { reviewId: id } });
          if (dimensions && dimensions.length > 0) {
            await tx.reviewDimension.createMany({
              data: dimensions.map((d) => ({
                reviewId: id,
                dimension: d.dimension,
                rating: d.rating,
              })),
            });
          }
        }

        return tx.review.findUniqueOrThrow({
          where: { id: updated.id },
          include: {
            user: { select: { id: true, name: true, image: true } },
            dimensions: true,
          },
        });
      });

      // Invalidate recommendation cache for this user
      await prisma.recommendationCache.deleteMany({
        where: { userId: ctx.user.id },
      }).catch(() => { /* noop */ });

      return review;
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
      const averageRating = calculateAvgRating(reviews)!;
      
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

  /**
   * Get per-dimension average ratings for a neighborhood
   */
  getDimensionStats: publicProcedure
    .input(z.object({ neighborhoodId: z.string().uuid() }))
    .query(async ({ input }) => {
      const stats = await prisma.reviewDimension.groupBy({
        by: ['dimension'],
        where: {
          review: { neighborhoodId: input.neighborhoodId },
        },
        _avg: { rating: true },
        _count: { rating: true },
      });

      return stats.map((s) => ({
        dimension: s.dimension,
        avgRating: Math.round((s._avg.rating ?? 0) * 100) / 100,
        count: s._count.rating,
      }));
    }),

  /**
   * Admin: Get all reviews with pagination
   */
  adminGetAll: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional(),
    )
    .query(async ({ input }) => {
      const { limit = 50, offset = 0 } = input ?? {};
      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
            neighborhood: { select: { id: true, name: true } },
          },
        }),
        prisma.review.count(),
      ]);
      return {
        reviews,
        pagination: { total, limit, offset, hasMore: offset + limit < total },
      };
    }),
});
