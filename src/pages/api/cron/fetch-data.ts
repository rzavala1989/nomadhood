import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '@/server/env';
import { fetchAllWalkScores } from '@/server/services/walkScore';
import { fetchAllRentData } from '@/server/services/rentcast';
import { fetchAllCrimeData } from '@/server/services/crimeData';
import { fetchAllBlsData } from '@/server/services/blsData';
import { fetchAllEvents } from '@/server/services/eventbrite';
import { fetchAllNeighborhoodImages } from '@/server/services/neighborhoodImages';
import { createSnapshotAll } from '@/server/services/snapshots';
import { generateNewsAlerts } from '@/server/services/newsAlerts';

/**
 * Cron endpoint that runs the full external data pipeline.
 * Secured via CRON_SECRET (passed as Authorization bearer token or query param).
 *
 * Vercel Cron hits this automatically based on vercel.json config.
 * Can also be triggered manually: curl -H "Authorization: Bearer $CRON_SECRET" /api/cron/fetch-data
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret
  const secret = env.CRON_SECRET;
  if (secret) {
    const authHeader = req.headers.authorization;
    const querySecret = req.query.secret;
    const token = authHeader?.replace('Bearer ', '') ?? querySecret;

    if (token !== secret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const start = Date.now();

  const [walkScore, rentData, crimeData, bls, events, images] = await Promise.all([
    fetchAllWalkScores().catch(() => ({ fetched: 0, skipped: 0, failed: 0 })),
    fetchAllRentData().catch(() => ({
      fetched: 0,
      skipped: 0,
      failed: 0,
      rateLimited: false,
      propagated: 0,
    })),
    fetchAllCrimeData().catch(() => ({ fetched: 0, skipped: 0, failed: 0 })),
    fetchAllBlsData().catch(() => ({ fetched: 0, skipped: 0, failed: 0 })),
    fetchAllEvents().catch(() => ({ fetched: 0, skipped: 0, failed: 0 })),
    fetchAllNeighborhoodImages().catch(() => ({ fetched: 0, skipped: 0, failed: 0 })),
  ]);

  // Weekly snapshots: only run on Sundays
  let snapshots: { neighborhoodsProcessed: number; snapshotsWritten: number; expiredDeleted: number } | null = null;
  if (new Date().getDay() === 0) {
    snapshots = await createSnapshotAll().catch(() => ({
      neighborhoodsProcessed: 0,
      snapshotsWritten: 0,
      expiredDeleted: 0,
    }));
  }

  // News alerts for favorited neighborhoods
  const newsAlerts = await generateNewsAlerts().catch(() => ({
    alertsGenerated: 0,
    neighborhoodsScanned: 0,
    newsRefreshed: 0,
  }));

  const duration = Date.now() - start;

  const result = {
    ok: true,
    durationMs: duration,
    walkScore,
    rentData,
    crimeData,
    bls,
    events,
    images,
    snapshots,
    newsAlerts,
  };

  console.log('[cron/fetch-data]', JSON.stringify(result));

  return res.status(200).json(result);
}
