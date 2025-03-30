import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '~/server/trpc';
import { prisma } from '~/server/prisma';

export const neighborhoodsRouter = router({
    list: publicProcedure.query(async () => {
        return prisma.neighborhood.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }),

    create: protectedProcedure
        .input(
            z.object({
                name: z.string(),
                city: z.string(),
                state: z.string(),
                zip: z.string(),
                description: z.string().optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            return prisma.neighborhood.create({
                data: {
                    ...input,
                },
            });
        }),
});
