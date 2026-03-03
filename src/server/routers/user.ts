import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc';
import { prisma } from '../prisma';

export const userRouter = router({
  /**
   * Get current user (based on session/context)
   */
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user ?? null;
  }),

  /**
   * Update current user's name and image
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        image: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.user.update({
        where: { id: ctx.user.id },
        data: input,
      });
    }),

  /**
   * Get a public-facing user profile (optional, like for viewing other users)
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ input }) =>
      prisma.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          image: true,
          createdAt: true,
        },
      }),
    ),

  /**
   * Get public user profile with reviews and favorites
   */
  getPublicProfile: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          image: true,
          createdAt: true,
          reviews: {
            include: {
              neighborhood: {
                select: { id: true, name: true, city: true, state: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          favorites: {
            include: {
              neighborhood: {
                select: { id: true, name: true, city: true, state: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: { select: { reviews: true, favorites: true } },
        },
      });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }
      return user;
    }),

  /**
   * Admin check (for conditional rendering or logic)
   */
  isAdmin: protectedProcedure.query(({ ctx }) => ({
    isAdmin: ctx.user.isAdmin,
  })),

  /**
   * Admin-only: Get all users
   */
  getAll: adminProcedure.query(() => {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
      },
    });
  }),

  /**
   * Admin-only: Promote a user to admin
   */
  promote: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(({ input }) =>
      prisma.user.update({
        where: { id: input.userId },
        data: { isAdmin: true },
      }),
    ),

  /**
   * Admin-only: Demote a user from admin
   */
  demote: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(({ input }) =>
      prisma.user.update({
        where: { id: input.userId },
        data: { isAdmin: false },
      }),
    ),

  /**
   * Admin-only: Delete user
   */
  delete: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(({ input }) =>
      prisma.user.delete({
        where: { id: input.userId },
      }),
    ),
});
