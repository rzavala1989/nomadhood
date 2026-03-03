# Architecture

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (Pages Router) | 15 |
| UI | React | 19 |
| API | tRPC | 11 |
| ORM | Prisma | 6 |
| Auth | Auth.js (next-auth) | 5.0.0-beta |
| Database | PostgreSQL | n/a |
| Styling | Tailwind CSS, shadcn/ui, and Radix | 3.4 |
| Charts | recharts | 2.15 |
| Maps | MapLibre GL and react-map-gl | 5.19 / 8.1 |
| Drag and Drop | @dnd-kit | 6.3 |
| Toasts | sonner | 2.0 |
| Forms | react-hook-form and zod | 7.55 / 3.24 |
| Package Manager | Bun | n/a |

## Directory Structure

```
src/
  pages/                       Next.js pages (Pages Router)
    index.tsx                   Landing page
    dashboard.tsx               Analytics dashboard
    profile.tsx                 User profile editor
    favorites.tsx               Drag-and-drop favorites list
    compare.tsx                 Side-by-side neighborhood comparison
    404.tsx                     Not found
    _app.tsx                    App wrapper (providers, layout)
    _document.tsx               Document head
    auth/
      signin.tsx                GitHub OAuth sign-in
    neighborhoods/
      index.tsx                 Browse and map split-view
      [id].tsx                  Neighborhood detail and reviews
    users/
      [id].tsx                  Public user profile
    admin/
      users.tsx                 User management (admin)
      neighborhoods.tsx         Neighborhood CRUD (admin)
      reviews.tsx               Review moderation (admin)
    api/
      auth/[...nextauth]/       Auth.js API handler (App Router)
      trpc/[trpc].ts            tRPC API handler

  components/
    ui/                         shadcn/ui primitives (button, input, card, etc.)
    auth/
      SignInForm.tsx             GitHub OAuth button
    dashboard/
      activity-feed.tsx         Recent reviews timeline
      review-trend-chart.tsx    Area chart: reviews over time
      top-neighborhoods-chart.tsx  Bar chart: top-rated neighborhoods
    landing/
      Hero.tsx                  Landing page hero section
    admin-layout.tsx            Admin guard and sub-navigation
    app-sidebar.tsx             Main sidebar navigation
    comparison-bar.tsx          Floating comparison bottom bar
    dashboard-layout.tsx        Authenticated layout with sidebar
    favorite-button.tsx         Toggle favorite with toast
    neighborhood-card.tsx       Card with compare and Nomad Score
    neighborhood-map.tsx        MapLibre GL map with markers
    neighborhood-map-wrapper.tsx  Dynamic import wrapper (SSR disabled)
    rating-distribution-chart.tsx  Horizontal bar chart (1-5 stars)
    review-form.tsx             Create/edit review form
    section-cards.tsx           Dashboard stat cards
    star-rating.tsx             Star display component

  server/
    routers/                    tRPC routers (see below)
    context.ts                  tRPC context, reads session from cookie
    env.ts                      Zod environment validation
    prisma.ts                   Prisma client singleton
    trpc.ts                     Procedure definitions (public/protected/admin)

  contexts/
    comparison-context.tsx      React context for neighborhood comparison (up to 3)

  styles/
    globals.css                 Design tokens, base styles, MapLibre overrides

  types/
    next-auth.d.ts              Session/User type extensions (isAdmin)

  utils/
    trpc.ts                     tRPC React client setup
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

Auth runs separately through Auth.js:
```
Browser -> /api/auth/* (App Router) -> Auth.js -> GitHub OAuth -> Prisma Adapter -> PostgreSQL
```

The tRPC context reads the session token cookie directly from the request and looks it up in the database via Prisma; it does not call the Auth.js `auth()` function.

## tRPC Router Map

### Root (`_app.ts`)

| Procedure | Type | Access |
|-----------|------|--------|
| `healthcheck` | query | public |
| `getDashboardStats` | query | public |
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

Access levels:
- **public**: no authentication required
- **protected**: requires authenticated session
- **admin**: requires authenticated session with `isAdmin: true`
