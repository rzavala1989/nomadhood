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
import {
  getBlsData,
  fetchAllBlsData,
} from '@/server/services/blsData';
import {
  getEvents,
  fetchAllEvents,
} from '@/server/services/eventbrite';
import {
  getNeighborhoodImages,
  fetchAllNeighborhoodImages,
  triggerUnsplashDownload,
} from '@/server/services/neighborhoodImages';
import { prisma } from '@/server/prisma';
import type { NeighborhoodExternalData } from '@/server/services/types';

export const dataRouter = router({
  /** Read all cached external data for a neighborhood. No API calls. */
  getAll: publicProcedure
    .input(z.object({ neighborhoodId: z.string().uuid() }))
    .query(async ({ input }): Promise<NeighborhoodExternalData> => {
      const [walkScore, rentData, crimeData, costOfLiving, events, images] =
        await Promise.all([
          getWalkScore(input.neighborhoodId),
          getRentData(input.neighborhoodId),
          getCrimeData(input.neighborhoodId),
          getBlsData(input.neighborhoodId),
          getEvents(input.neighborhoodId),
          getNeighborhoodImages(input.neighborhoodId),
        ]);

      return {
        walkScore,
        rentData,
        crimeData,
        costOfLiving,
        events,
        images,
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

  /** Admin: fetch BLS cost-of-living data for all mapped metros (skips valid cache). */
  fetchCostOfLiving: adminProcedure.mutation(async () => {
    return fetchAllBlsData();
  }),

  /** Admin: fetch Eventbrite events for all cities with configured sources. */
  fetchEvents: adminProcedure.mutation(async () => {
    return fetchAllEvents();
  }),

  /** Admin: fetch neighborhood images from Unsplash/Wikimedia (skips valid cache). */
  fetchImages: adminProcedure.mutation(async () => {
    return fetchAllNeighborhoodImages();
  }),

  /** Batch read cached images for multiple neighborhoods (first image per neighborhood for cards). */
  getImages: publicProcedure
    .input(z.object({ neighborhoodIds: z.array(z.string().uuid()) }))
    .query(async ({ input }) => {
      const rows = await prisma.neighborhoodImageCache.findMany({
        where: { neighborhoodId: { in: input.neighborhoodIds } },
        orderBy: { position: 'asc' },
      });

      // Group by neighborhoodId, return first image per neighborhood for cards
      // and full array for detail views
      const result: Record<
        string,
        {
          thumbUrl: string | null;
          imageUrl: string;
          altText: string | null;
          source: string;
          photographerName: string | null;
          photographerUrl: string | null;
          pageUrl: string | null;
        }[]
      > = {};

      for (const row of rows) {
        if (!result[row.neighborhoodId]) {
          result[row.neighborhoodId] = [];
        }
        result[row.neighborhoodId].push({
          thumbUrl: row.thumbUrl,
          imageUrl: row.imageUrl,
          altText: row.altText,
          source: row.source,
          photographerName: row.photographerName,
          photographerUrl: row.photographerUrl,
          pageUrl: row.pageUrl,
        });
      }

      return result;
    }),

  /** Trigger Unsplash download event (required by Unsplash API guidelines). */
  trackUnsplashDownload: publicProcedure
    .input(z.object({ neighborhoodId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await triggerUnsplashDownload(input.neighborhoodId);
    }),

  /** Admin: get current Rentcast monthly usage. */
  getRentcastUsage: adminProcedure.query(async () => {
    return getRentcastUsage();
  }),
});
