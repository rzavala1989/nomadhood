import { z } from 'zod';
import { router, publicProcedure, adminProcedure } from '@/server/trpc';
import { getWalkScore, fetchAllWalkScores } from '@/server/services/walkScore';
import {
  getRentData,
  fetchAllRentData,
  getRentcastUsage,
} from '@/server/services/rentcast';
import {
  getCrimeData,
  fetchAllCrimeData,
} from '@/server/services/crimeData';
import type { NeighborhoodExternalData } from '@/server/services/types';

export const dataRouter = router({
  /** Read all cached external data for a neighborhood. No API calls. */
  getAll: publicProcedure
    .input(z.object({ neighborhoodId: z.string().uuid() }))
    .query(async ({ input }): Promise<NeighborhoodExternalData> => {
      const [walkScore, rentData, crimeData] = await Promise.all([
        getWalkScore(input.neighborhoodId),
        getRentData(input.neighborhoodId),
        getCrimeData(input.neighborhoodId),
      ]);

      // Remaining sources wired in later phases
      return {
        walkScore,
        rentData,
        crimeData,
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

  /** Admin: fetch Rentcast data for all unique zips (skips valid cache). */
  fetchRentData: adminProcedure.mutation(async () => {
    return fetchAllRentData();
  }),

  /** Admin: fetch FBI crime data for all unique city/state pairs (skips valid cache). */
  fetchCrimeData: adminProcedure.mutation(async () => {
    return fetchAllCrimeData();
  }),

  /** Admin: get current Rentcast monthly usage. */
  getRentcastUsage: adminProcedure.query(async () => {
    return getRentcastUsage();
  }),
});
