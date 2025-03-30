import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, adminProcedure } from '~/server/trpc';
import { prisma } from '~/server/prisma';

export const neighborhoodsRouter = router({
    list: publicProcedure.query(() =>
        prisma.neighborhood.findMany({
            orderBy: { createdAt: 'desc' },
        })
    ),

    getById: publicProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(({ input }) =>
            prisma.neighborhood.findUnique({
                where: { id: input.id },
            })
        ),

    create: adminProcedure
        .input(
            z.object({
                name: z.string(),
                city: z.string(),
                state: z.string(),
                zip: z.string(),
                description: z.string().optional(),
            })
        )
        .mutation(({ input }) =>
            prisma.neighborhood.create({
                data: input,
            })
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
            })
        )
        .mutation(({ input }) =>
            prisma.neighborhood.update({
                where: { id: input.id },
                data: input,
            })
        ),

    delete: adminProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(({ input }) =>
            prisma.neighborhood.delete({
                where: { id: input.id },
            })
        ),
});
