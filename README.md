# Nomadhood

**Neighborhood intelligence platform for digital nomads.** Data-backed neighborhood discovery powered by seven external APIs, a cosine-similarity recommendation engine, real-time news intelligence with signal classification, and community reviews with multi-dimensional ratings.

**[Live App](https://nomadhood.vercel.app)** &nbsp;|&nbsp; **Built with:** Next.js 15, React 19, tRPC v11, Prisma 6, PostgreSQL, MapLibre GL

<br/>

## Why This Exists

Choosing where to live as a remote worker means weighing dozens of signals: walkability, rent trends, crime rates, transit access, coworking density, local culture. Most platforms give you one or two of those. Nomadhood aggregates all of them, layers in community-driven reviews across six lifestyle dimensions, and runs a recommendation engine that learns your preferences from what you've rated highly.

<br/>

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Client (React 19, MapLibre GL, recharts, dnd-kit)              │
│  ┌─────────────┐  ┌───────────────┐  ┌────────────────────┐    │
│  │ Browse +     │  │ Dashboard     │  │ Neighborhood       │    │
│  │ Map View     │  │ Analytics     │  │ Detail + Pulse     │    │
│  └──────┬───────┘  └──────┬────────┘  └────────┬───────────┘    │
│         └─────────────────┴────────────────────┘                │
│                           │ tRPC React Query hooks              │
├───────────────────────────┼─────────────────────────────────────┤
│  Server (tRPC v11)        │                                     │
│  ┌────────────────────────┴────────────────────────────────┐    │
│  │  8 routers, 54 procedures (public / protected / admin)  │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│  │  │ Recs Engine   │  │ News Intel   │  │ Nomad Score  │  │    │
│  │  │ (cosine sim)  │  │ (classify +  │  │ (weighted    │  │    │
│  │  │               │  │  sentiment)  │  │  composite)  │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                     │
├───────────────────────────┼─────────────────────────────────────┤
│  Data Layer               │                                     │
│  ┌────────────────────────┴────────────────────────────────┐    │
│  │  Prisma 6, PostgreSQL (Neon), 19 models                 │    │
│  │  Cache tables for each external API with TTL logic       │    │
│  │  Weekly neighborhood snapshots for trend analysis        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                     │
├───────────────────────────┼─────────────────────────────────────┤
│  External Data Pipeline   │                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐ ┌──────┐ ┌──────────┐  │
│  │Walk  │ │Rent  │ │FBI   │ │News    │ │Event │ │Unsplash/ │  │
│  │Score │ │cast  │ │Crime │ │data.io │ │brite │ │Wikimedia │  │
│  └──────┘ └──────┘ └──────┘ └────────┘ └──────┘ └──────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

<br/>

## Technical Highlights

### Recommendation Engine (Cosine Similarity)
The recommendation system builds a user preference profile from highly-rated reviews (4+ stars), constructing a multi-dimensional vector from six lifestyle dimension ratings. It then computes cosine similarity against every unreviewed neighborhood's aggregate dimension vector, blending the result with four additional weighted signals:

- **Dimension similarity** (30%): cosine distance between user profile and neighborhood review averages
- **Walk Score proximity** (25%): how close the neighborhood's walkability matches the user's preferred range
- **Rent proximity** (25%): median rent fit within the user's demonstrated budget tolerance (with $500 margin)
- **Safety match** (10%): violent crime rate against user's observed tolerance threshold (1.2x buffer)
- **Geographic preference** (10%): bonus for states where the user has previously rated neighborhoods highly

Results are cached in the database with a 24-hour TTL. Cold-start users (fewer than 2 rated reviews) receive globally top-rated fallback recommendations.

### Composite Nomad Score
Each neighborhood gets a 0-100 "Nomad Score" that blends community signals with objective data. When external data is available, the weights shift to include walkability (15%), transit/bike scores (10%), inverse crime rate (15%), and inverse median rent (20%). When external APIs haven't been fetched yet, it gracefully degrades to a community-only formula weighted on average rating, review volume, and favorites.

### News Intelligence Pipeline
News articles are fetched from newsdata.io, stored with a 6-hour cache TTL, and classified through a two-layer signal mapper: newsdata categories map to nomad-relevant signals (Infrastructure, Safety, Cost of Living, Food and Culture, Tech and Coworking, Community), and AI tags provide a second classification pass for higher specificity. The pipeline generates a "Neighborhood Pulse" view with categorized articles, trending analysis, and proactive risk alerts for favorited neighborhoods when negative sentiment spikes.

### External Data Architecture
All seven external API integrations follow the same pattern: fetch-and-cache with TTL-based invalidation, graceful degradation when APIs are unavailable, and admin-controlled trigger endpoints. The data pipeline is completely decoupled from the display layer. Client-side reads only hit the database cache tables, never the external APIs directly. This keeps page loads fast and API costs predictable.

<br/>

## Key Engineering Decisions

| Decision | Rationale |
|----------|-----------|
| **Pages Router over App Router** | Stable tRPC v11 integration, mature data fetching patterns, lower migration risk with Auth.js v5 beta |
| **tRPC over REST** | End-to-end type safety across 54 procedures, three access levels (public/protected/admin) enforced at the router level |
| **Prisma cache tables per API** | Each external source has different freshness needs (Walk Score = monthly, news = 6hr, events = daily). Per-source TTLs avoid over-fetching |
| **MapLibre over Mapbox** | Open-source, no token cost scaling, same react-map-gl integration surface |
| **Zod env validation** | Runtime crash on missing env vars at startup, not silent undefined failures in production |
| **Cosine similarity over collaborative filtering** | Works with sparse data (most neighborhoods have few reviews). No cold-start matrix factorization needed |

<br/>

## Data Model

19 Prisma models covering users, neighborhoods, reviews with per-dimension ratings, favorites with drag-and-drop ordering, recommendation caches, news articles, news alerts, neighborhood snapshots for trend tracking, and cache tables for each external API (WalkScore, Rentcast, FBI crime, BLS cost-of-living, Eventbrite, Unsplash/Wikimedia images).

```
User ──┬── Review ── ReviewDimension
       ├── Favorite (orderable)
       ├── RecommendationCache
       └── NewsAlert

Neighborhood ──┬── Review
               ├── Favorite
               ├── WalkScoreCache
               ├── NeighborhoodImageCache
               ├── RecommendationCache
               ├── NeighborhoodSnapshot (weekly)
               └── NeighborhoodNews (6hr TTL)

Standalone caches: RentcastCache, CrimeDataCache, CostOfLivingCache, EventCache
```

<br/>

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (Pages Router) |
| UI | React 19, Tailwind CSS, shadcn/ui, Radix primitives |
| API | tRPC v11 with React Query |
| Auth | Auth.js v5 (GitHub + Google + credentials) |
| Database | PostgreSQL on Neon, Prisma 6 ORM |
| Maps | MapLibre GL via react-map-gl |
| Charts | recharts |
| Forms | React Hook Form + Zod validation |
| Drag and Drop | @dnd-kit |
| Runtime | Bun |
| Testing | Vitest (unit), Playwright (e2e) |
| Deployment | Vercel |

<br/>

## Getting Started

```bash
git clone https://github.com/rzavala1989/nomadhood.git && cd nomadhood
cp .env.example .env           # fill in credentials
bun install
bun run migrate-dev            # run migrations, generate Prisma client
bun run db:seed                # optional: seed sample data
bun dev                        # http://localhost:3000
```

Requires Node 18+, Bun, and PostgreSQL ([Neon](https://neon.tech) free tier works).

<br/>

## Project Structure

```
src/
  pages/              Next.js pages (browse, dashboard, compare, admin, auth)
  components/         React components (ui/, dashboard/, auth/, landing/)
  server/
    routers/          8 tRPC routers, 54 procedures
    services/         7 external API integrations
    constants/        Score weights, dimension defs, news classifiers
    utils/            Nomad Score computation, query helpers
  contexts/           Comparison state (up to 3 neighborhoods)
  hooks/              Responsive breakpoint detection
  styles/             Design tokens, MapLibre overrides

prisma/
  schema.prisma       19 models
  seed.ts             Sample data seeder
  migrations/         Migration history

docs/                 Architecture, database, auth, features, data pipeline, dev guide
```

<br/>

## License

Private.
