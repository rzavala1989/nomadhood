import { z } from 'zod';
import { router, publicProcedure, adminProcedure } from '@/server/trpc';
import { getWalkScore, fetchAllWalkScores } from '@/server/services/walkScore';
import type { NeighborhoodExternalData } from '@/server/services/types';

export const dataRouter = router({
  /** Read all cached external data for a neighborhood. No API calls. */
  getAll: publicProcedure
    .input(z.object({ neighborhoodId: z.string().uuid() }))
    .query(async ({ input }): Promise<NeighborhoodExternalData> => {
      const walkScore = await getWalkScore(input.neighborhoodId);

      // Remaining sources wired in later phases
      return {
        walkScore,
        rentData: null,
        crimeData: null,
        costOfLiving: { cpi: null, wage: null },
        events: null,
      };
    }),

  /** Read Walk Score from DB cache. */
  getWalkScore: publicProcedure
    .input(z.object({ neighborhoodId: z.string().uuid() }))
    .query(async ({ input }) => {
      return getWalkScore(input.neighborhoodId);
    }),

  /** Admin: fetch Walk Scores for all neighborhoods (skips valid cache). */
  fetchWalkScores: adminProcedure.mutation(async () => {
    return fetchAllWalkScores();
  }),
});
