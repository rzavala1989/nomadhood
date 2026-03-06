# Architecture

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (Pages Router) | 15 |
| UI | React | 19 |
| API | tRPC | 11 |
| ORM | Prisma | 6 |
| Auth | Auth.js (next-auth) | 5 beta |
| Database | PostgreSQL (Neon) | -- |
| Styling | Tailwind CSS, shadcn/ui, Radix | 3.4 |
| Charts | recharts | 2.15 |
| Maps | MapLibre GL, react-map-gl | 5.19, 8.1 |
| Drag and Drop | @dnd-kit | 6.3 |
| Toasts | sonner | 2.0 |
| Forms | react-hook-form, zod | 7.55, 3.24 |
| Package Manager | Bun | -- |

## Directory Structure

```
src/
  pages/
    index.tsx                    Landing page
    dashboard.tsx                Analytics dashboard (stat cards, charts, news pulse, risk alerts)
    profile.tsx                  User profile editor
    favorites.tsx                Drag-and-drop favorites list
    compare.tsx                  Side-by-side neighborhood comparison
    404.tsx                      Not found
    _app.tsx                     App wrapper (providers, layout)
    _document.tsx                Document head
    auth/
      signin.tsx                 GitHub OAuth sign-in
    neighborhoods/
      index.tsx                  Browse with map split-view
      [id].tsx                   Detail: reviews, scores, pulse, events, similar
    users/
      [id].tsx                   Public user profile
    admin/
      users.tsx                  User management
      neighborhoods.tsx          Neighborhood CRUD
      reviews.tsx                Review moderation
      data.tsx                   External data pipeline controls
    api/
      auth/[...nextauth]/        Auth.js handler (App Router)
      cron/fetch-data.ts         Scheduled data and alert pipeline
      trpc/[trpc].ts             tRPC API handler
      signup.ts                  Registration endpoint

  components/
    ui/                          shadcn/ui primitives
    auth/
      SignInForm.tsx              GitHub OAuth button
    dashboard/
      activity-feed.tsx          Recent reviews timeline
      review-trend-chart.tsx     Area chart: reviews over time
      top-neighborhoods-chart.tsx Bar chart: top-rated neighborhoods
      news-trending.tsx          Heating up / cooling down neighborhoods
      risk-alerts.tsx            Negative news spike alerts
    landing/
      Hero.tsx                   Landing hero section
    admin-layout.tsx             Admin guard and sub-navigation
    app-sidebar.tsx              Main sidebar navigation
    comparison-bar.tsx           Floating comparison bottom bar
    dashboard-layout.tsx         Authenticated layout with sidebar
    favorite-button.tsx          Toggle favorite with toast
    neighborhood-card.tsx        Card with image, compare, score
    neighborhood-data-panel.tsx  External data cards (walkability, rent, crime, cost, events)
    neighborhood-data-utils.ts   National averages, formatting helpers
    neighborhood-map.tsx         MapLibre GL map with markers
    neighborhood-map-wrapper.tsx Dynamic import wrapper (SSR disabled)
    neighborhood-pulse.tsx       Categorized news with sentiment scoring
    pagination.tsx               Paginated list controls
    rating-distribution-chart.tsx Horizontal bar chart (1-5 stars)
    recent-neighborhoods.tsx     Grid of recently active neighborhoods
    review-form.tsx              Create/edit review with dimension ratings
    section-cards.tsx            Dashboard stat cards
    similar-neighborhoods.tsx    Related neighborhoods with images
    site-header.tsx              Header with title and alert badge
    star-rating.tsx              Star display component

  server/
    routers/
      _app.ts                    Root router (mounts all sub-routers)
      dashboardRouter.ts         Dashboard stats, trends, activity
      dataRouter.ts              External data reads and admin fetch triggers
      favoritesRouter.ts         Favorite toggle, list, reorder
      neighborhoodsRouter.ts     CRUD, list, scores, similar
      newsRouter.ts              News pulse, trending, alerts
      recommendationsRouter.ts   Personalized neighborhood recommendations
      reviewsRouter.ts           Review CRUD with dimensions
      trendsRouter.ts            Neighborhood snapshots and trend data
      user.ts                    User profile, admin management
    services/
      blsData.ts                 BLS economic data (CPI, wages)
      crimeData.ts               FBI crime rates
      eventbrite.ts              Local events
      neighborhoodImages.ts      Unsplash and Wikimedia images
      newsAlerts.ts              Risk alert generation from news spikes
      newsdata.ts                News fetching, pulse analysis, trending
      rentcast.ts                Housing cost data
      snapshots.ts               Weekly neighborhood snapshots
      types.ts                   Shared service return types
      walkScore.ts               Walkability scores
    constants/
      dimensions.ts              Review dimension definitions
      newsCategories.ts          News-to-nomad-signal classifier
      queries.ts                 Shared Prisma query fragments
      scores.ts                  Nomad Score calculation weights
    utils/                       Score computation helpers
    context.ts                   tRPC context (session from cookie via Prisma)
    env.ts                       Zod environment validation
    prisma.ts                    Prisma client singleton
    trpc.ts                      Procedure definitions (public/protected/admin)

  contexts/
    comparison-context.tsx       Neighborhood comparison state (up to 3)

  hooks/
    use-mobile.tsx               Responsive breakpoint hook

  styles/
    globals.css                  Design tokens, animations, MapLibre overrides

  types/
    next-auth.d.ts               Session/User type extensions (isAdmin)

  utils/
    trpc.ts                      tRPC React client setup
    format.ts                    Display formatting helpers
    transformer.ts               superjson transformer
```

## Data Flow

```
Browser -> Next.js Pages Router -> tRPC React Query hooks
                                         |
                                tRPC API handler (/api/trpc/[trpc])
                                         |
                                tRPC Context (session from cookie via Prisma)
                                         |
                                tRPC Router procedures
                                         |
                                Prisma ORM -> PostgreSQL
```

Auth runs through Auth.js separately:
```
Browser -> /api/auth/* (App Router) -> Auth.js -> GitHub OAuth -> Prisma Adapter -> PostgreSQL
```

External data pipeline (fetch and display are decoupled):
```
Admin or Cron -> service layer -> External API -> DB cache tables
Client -> trpc.data.getAll -> DB reads only -> UI
```

News intelligence pipeline:
```
Cron or on-demand -> newsdata.io API -> NeighborhoodNews table
                  -> classifyArticle() -> signal categories
                  -> sentiment analysis -> pulse scores, trending
                  -> generateNewsAlerts() -> NewsAlert table (for favorited neighborhoods)
```

## tRPC Router Map

### `dashboard`

| Procedure | Type | Access |
|-----------|------|--------|
| `getStats` | query | public |
| `getRecentActivity` | query | public |
| `getTopNeighborhoods` | query | public |
| `getReviewTrend` | query | public |

### `user`

| Procedure | Type | Access |
|-----------|------|--------|
| `me` | query | protected |
| `updateProfile` | mutation | protected |
| `getById` | query | protected |
| `getPublicProfile` | query | public |
| `isAdmin` | query | protected |
| `getAll` | query | admin |
| `promote` | mutation | admin |
| `demote` | mutation | admin |
| `delete` | mutation | admin |

### `neighborhoods`

| Procedure | Type | Access |
|-----------|------|--------|
| `list` | query | public |
| `getById` | query | public |
| `getWithScores` | query | public |
| `getSimilar` | query | public |
| `create` | mutation | admin |
| `update` | mutation | admin |
| `delete` | mutation | admin |

### `reviews`

| Procedure | Type | Access |
|-----------|------|--------|
| `getByNeighborhood` | query | public |
| `getUserReview` | query | protected |
| `getStats` | query | public |
| `create` | mutation | protected |
| `update` | mutation | protected |
| `delete` | mutation | protected |
| `adminGetAll` | query | admin |
| `adminDelete` | mutation | admin |

### `favorites`

| Procedure | Type | Access |
|-----------|------|--------|
| `toggle` | mutation | protected |
| `getMine` | query | protected |
| `isFavorite` | query | protected |
| `reorder` | mutation | protected |

### `data`

| Procedure | Type | Access |
|-----------|------|--------|
| `getAll` | query | public |
| `getImages` | query | public |
| `getWalkScore` | query | public |
| `trackUnsplashDownload` | mutation | public |
| `fetchWalkScores` | mutation | admin |
| `fetchRentData` | mutation | admin |
| `fetchCrimeData` | mutation | admin |
| `fetchCostOfLiving` | mutation | admin |
| `fetchEvents` | mutation | admin |
| `fetchImages` | mutation | admin |
| `getRentcastUsage` | query | admin |

### `news`

| Procedure | Type | Access |
|-----------|------|--------|
| `getByNeighborhood` | query | public |
| `getPulse` | query | public |
| `getTrending` | query | public |
| `getAlerts` | query | protected |
| `markRead` | mutation | protected |
| `getUnreadCount` | query | protected |

### `recommendations`

| Procedure | Type | Access |
|-----------|------|--------|
| `getForUser` | query | protected |

### `trends`

| Procedure | Type | Access |
|-----------|------|--------|
| `getSnapshots` | query | public |
| `createSnapshot` | mutation | admin |

Access levels:
- **public**: no authentication required
- **protected**: requires authenticated session (`ctx.user`)
- **admin**: requires `ctx.user.isAdmin === true`
