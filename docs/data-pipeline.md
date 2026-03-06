# Data Pipeline

External APIs and news intelligence. All external data is fetched into DB cache tables, never during user requests.

## External Data Sources

| Source | Service File | Cache Model | TTL | Key |
|--------|-------------|-------------|-----|-----|
| Walk Score | `walkScore.ts` | `WalkScoreCache` | 60 days | `WALKSCORE_API_KEY` |
| Rentcast | `rentcast.ts` | `RentcastCache` | 30 days | `RENTCAST_API_KEY` |
| FBI Crime Data (CDE) | `crimeData.ts` | `CrimeDataCache` | 90 days | `FBI_CRIME_DATA_API_KEY` |
| BLS | `blsData.ts` | `BlsDataCache` | 30-180 days | `BLS_API_KEY` |
| Eventbrite | `eventbrite.ts` | `EventbriteCache` | 24 hours | `EVENTBRITE_API_KEY` |
| Unsplash and Wikimedia | `neighborhoodImages.ts` | `NeighborhoodImageCache` | 90 days | `UNSPLASH_ACCESS_KEY` |
| newsdata.io | `newsdata.ts` | `NeighborhoodNews` | 6 hours | `NEWSDATA_IO_API_KEY` |

All service files are in `src/server/services/`.

## Fetch and Display Architecture

```
Fetch path (admin or cron):
  Admin button on /admin/data  OR  Cron job (/api/cron/fetch-data)
    -> Service function iterates neighborhoods
    -> Calls external API
    -> Writes/upserts to DB cache table
    -> Respects TTL: skips if valid cache exists

Display path (user request):
  Client -> trpc.data.getAll({ neighborhoodId })
    -> DB reads only, zero external API calls
    -> Returns data + fetchedAt per source, or null if not fetched
    -> UI renders with "LAST UPDATED" timestamps
```

## Rate Limit Strategies

- **Rentcast**: Hard 50/month cap, soft limit at 45 via `ApiRateLimitTracker`. Fetches one representative zip per city, propagates to sibling zips (16 API calls cover ~70 zips).
- **FBI Crime Data**: State-level only. Fetches once per state, propagates to all cities in that state.
- **BLS**: Batches up to 50 series per POST request.
- **newsdata.io**: In-memory daily call counter, warns at 150 (free tier limit: 200/day). 6-hour cache per neighborhood.
- **All services**: Skip neighborhoods with valid (non-expired) cache entries.

## News Intelligence

### Article Caching (`newsdata.ts`)

`getNeighborhoodNews(neighborhoodId)`: fetches articles from newsdata.io, upserts to `NeighborhoodNews` table, 6-hour cache. Queries by neighborhood name and city with multiple search patterns.

### Signal Classification (`newsCategories.ts`)

`classifyArticle(category[], aiTag[])`: maps newsdata categories and AI tags to 6 nomad signal categories:

| Signal | Example Sources |
|--------|----------------|
| Infrastructure | politics, environment, transportation, urban development |
| Safety | crime, public safety, violence, theft |
| Cost of Living | business, real estate, housing, rent |
| Food and Culture | food, entertainment, dining, arts, nightlife |
| Tech and Coworking | technology, startup, remote work, coworking |
| Community | top, health, education, local, neighborhood |

Defaults to "Community" when no categories match.

### Neighborhood Pulse (`getNeighborhoodPulse`)

Per-neighborhood analysis:
1. Refreshes news cache
2. Fetches all articles from last 30 days
3. Classifies each, groups top 10 by signal category
4. Computes sentiment score: avg across 30 days (positive=+1, neutral=0, negative=-1)
5. Computes trend direction: 7-day avg vs 8-30 day avg sentiment. Threshold of 0.1 for improving/declining.

### Trending (`getNewsTrending`)

Cross-neighborhood analysis:
1. All articles from last 30 days, grouped by neighborhood
2. Velocity = `(7d_count / 7) / (30d_count / 30)`. Above 1 = accelerating coverage.
3. Heating up score = velocity * positive ratio
4. Cooling down score = velocity * negative ratio
5. Minimum 2 articles in 30-day window to qualify

### Risk Alerts (`newsAlerts.ts`)

`generateNewsAlerts()`:
1. Fetches all favorites, groups by neighborhood
2. Refreshes news for favorited neighborhoods (capped at 30 per run, prioritized by favorite count)
3. Queries negative articles in last 7 days
4. Neighborhoods with 3+ negatives: upserts alert for each user who favorited it
5. Severity: 5+ = "high", 3-4 = "medium"
6. Idempotent via unique constraint `(userId, neighborhoodId, alertType, triggerDate)`
7. Cleans up alerts older than 90 days

## Cron Job

`/api/cron/fetch-data`: Vercel Cron hits daily at 6 AM UTC. Secured via `CRON_SECRET` bearer token.

Runs in order:
1. All external data services in parallel (walk score, rent, crime, BLS, events, images)
2. Weekly snapshots (Sundays only)
3. News alert generation

Configure schedule in `vercel.json`.

## Admin Data Management

`/admin/data`: per-service fetch buttons, bulk "Fetch All" button, Rentcast usage counter. Each button triggers an admin mutation and shows a toast with results.

## Unsplash Compliance

Image display triggers download tracking via `data.trackUnsplashDownload` mutation (Unsplash API guidelines). Attribution rendered as overlay text on images.
