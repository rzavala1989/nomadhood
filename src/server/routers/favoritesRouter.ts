import { z } from 'zod';
import { router, protectedProcedure } from '@/server/trpc';
import { prisma } from '@/server/prisma';

export const favoritesRouter = router({
  toggle: protectedProcedure
    .input(z.object({ neighborhoodId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.favorite.findUnique({
        where: {
          userId_neighborhoodId: {
            userId: ctx.user.id,
            neighborhoodId: input.neighborhoodId,
          },
        },
      });

      if (existing) {
        await prisma.favorite.delete({
          where: {
            userId_neighborhoodId: {
              userId: ctx.user.id,
              neighborhoodId: input.neighborhoodId,
            },
          },
        });
        return { removed: true };
      }

      await prisma.favorite.create({
        data: {
          userId: ctx.user.id,
          neighborhoodId: input.neighborhoodId,
        },
      });

      return { added: true };
    }),

  getMine: protectedProcedure.query(({ ctx }) =>
    prisma.favorite.findMany({
      where: { userId: ctx.user.id },
      include: { neighborhood: true },
    }),
  ),

  isFavorite: protectedProcedure
    .input(z.object({ neighborhoodId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_neighborhoodId: {
            userId: ctx.user.id,
            neighborhoodId: input.neighborhoodId,
          },
        },
      });

      return { isFavorite: !!favorite };
    }),
});
