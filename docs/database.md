# Database

PostgreSQL via Prisma v6. Schema at `prisma/schema.prisma`.

## Core Models

### User

Primary user record. Created automatically on first OAuth sign-in via the Auth.js Prisma adapter.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | primary key |
| email | VARCHAR(255) | unique |
| name | VARCHAR(100) | nullable, from GitHub profile |
| image | VARCHAR(500) | nullable, avatar URL |
| isAdmin | Boolean | default false |
| emailVerified | DateTime | nullable |
| createdAt, updatedAt | DateTime | auto |

Relations: Accounts, Sessions, Reviews, Favorites, RecommendationCache, NewsAlerts

### Neighborhood

A reviewable neighborhood with geographic data.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | primary key |
| name | VARCHAR(100) | |
| city | VARCHAR(50) | |
| state | CHAR(2) | US state abbreviation |
| zip | VARCHAR(10) | |
| description | TEXT | nullable |
| latitude, longitude | Float | nullable, for map pins |
| boundary | Json | nullable, GeoJSON boundary |
| createdAt, updatedAt | DateTime | auto |

Indexes: `(city, state)`, `zip`, `(latitude, longitude)`

Relations: Reviews, Favorites, WalkScoreCache, NeighborhoodImageCache[], RecommendationCache[], NeighborhoodSnapshot[], NeighborhoodNews[], NewsAlerts[]

### Review

One review per user per neighborhood. Star rating with optional comment and dimension sub-ratings.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | primary key |
| rating | SmallInt | 1-5 |
| comment | TEXT | nullable |
| userId | UUID | FK to User (cascade delete) |
| neighborhoodId | UUID | FK to Neighborhood (cascade delete) |
| createdAt, updatedAt | DateTime | auto |

Unique: `(userId, neighborhoodId)`

Relations: ReviewDimension[]

### ReviewDimension

Sub-ratings per review. Dimensions: wifi, safety, food, nightlife, walkability, cost_value.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | primary key |
| reviewId | UUID | FK to Review (cascade delete) |
| dimension | VARCHAR(30) | one of the 6 dimension keys |
| rating | SmallInt | 1-5 |

Unique: `(reviewId, dimension)`

### Favorite

Saved neighborhood with drag-and-drop ordering.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | primary key |
| position | Int | default 0, for ordering |
| userId | UUID | FK to User |
| neighborhoodId | UUID | FK to Neighborhood |
| createdAt | DateTime | auto |

Unique: `(userId, neighborhoodId)`

## External Data Cache Models

All cache models share: `fetchedAt`, `expiresAt`, and `rawResponse` (Json) fields.

| Model | Keyed By | Data | TTL |
|-------|----------|------|-----|
| WalkScoreCache | neighborhoodId (unique) | walk, transit, bike scores (0-100) with descriptions | 60 days |
| RentcastCache | zip (unique) | median rent, sale prices, per-sqft rates | 30 days |
| CrimeDataCache | (city, state) unique | violent and property crime rates per 100K, data year | 90 days |
| BlsDataCache | seriesId (unique) | CPI index or median hourly wage | 30-180 days |
| EventbriteCache | (city, state) unique | upcoming event count, top 5 event listings (Json) | 24 hours |
| NeighborhoodImageCache | (neighborhoodId, imageUrl) unique | Unsplash or Wikimedia images with attribution | 90 days |

### ApiRateLimitTracker

Monthly API call counter. Used for Rentcast's 50/month hard cap (soft limit at 45).

| Field | Type | Notes |
|-------|------|-------|
| apiName | VARCHAR(50) | unique, e.g. "rentcast" |
| callCount | Int | calls this period |
| periodStart, periodEnd | DateTime | billing period window |
| lastCalledAt | DateTime | nullable |

## Intelligence Models

### NeighborhoodNews

Cached news articles from newsdata.io per neighborhood.

| Field | Type | Notes |
|-------|------|-------|
| id | CUID | primary key |
| neighborhoodId | UUID | FK to Neighborhood |
| articleId | String | unique, from newsdata API |
| title | String | article headline |
| description | TEXT | nullable |
| url | String | article link |
| sourceId | String | nullable, news source identifier |
| sentiment | VARCHAR(20) | "positive", "negative", or "neutral" |
| category | String[] | newsdata categories |
| aiTag | String[] | newsdata AI-generated tags |
| pubDate | DateTime | publication date |
| fetchedAt | DateTime | when cached |

Index: `(neighborhoodId, pubDate DESC)`

### NewsAlert

Risk alerts generated for users who favorited neighborhoods with negative news spikes.

| Field | Type | Notes |
|-------|------|-------|
| id | CUID | primary key |
| userId | UUID | FK to User (cascade delete) |
| neighborhoodId | UUID | FK to Neighborhood (cascade delete) |
| triggerArticleIds | String[] | article IDs that triggered the alert |
| alertType | VARCHAR(30) | e.g. "negative_spike" |
| title | String | human-readable alert title |
| summary | TEXT | nullable, article title excerpts |
| severity | VARCHAR(10) | "high" (5+ articles) or "medium" (3-4) |
| isRead | Boolean | default false |
| triggerDate | Date | date the alert was generated |
| createdAt | DateTime | auto |

Unique: `(userId, neighborhoodId, alertType, triggerDate)` (idempotent daily)

Indexes: `(userId, isRead)`, `(userId, createdAt DESC)`, `neighborhoodId`

### RecommendationCache

Cached personalized neighborhood recommendations per user. Computed on-demand, 24-hour TTL.

| Field | Type | Notes |
|-------|------|-------|
| userId | UUID | FK to User |
| neighborhoodId | UUID | FK to Neighborhood |
| matchScore | Float | 0-1 similarity score |
| matchReasons | Json | array of reason strings |
| computedAt | DateTime | auto, used for TTL check |

Unique: `(userId, neighborhoodId)`

### NeighborhoodSnapshot

Weekly point-in-time snapshots for trend tracking. Created by cron on Sundays.

| Field | Type | Notes |
|-------|------|-------|
| neighborhoodId | UUID | FK to Neighborhood |
| snapshotDate | Date | snapshot day |
| nomadScore | Int | composite score at that time |
| avgRating | Float | nullable |
| reviewCount, favoriteCount | Int | denormalized counts |
| dimensionAvgs | Json | nullable, avg per dimension |

Unique: `(neighborhoodId, snapshotDate)`

## Auth Models (managed by Auth.js)

- **Account**: OAuth provider connections (GitHub)
- **Session**: Active sessions with expiry, token stored as cookie
- **VerificationToken**: Email verification (unused, GitHub-only flow)

## Commands

```bash
bun run migrate-dev     # create and apply migration (development)
bun run migrate         # apply pending migrations (production)
bun run db-reset        # reset database (destructive)
bun run generate        # regenerate Prisma client
bun prisma studio       # GUI database browser
bun run db:seed         # seed sample data
```

## Adding a Migration

1. Edit `prisma/schema.prisma`
2. Run `bun run migrate-dev` (prompts for migration name)
3. Prisma generates SQL in `prisma/migrations/` and applies it
4. Prisma client regenerates automatically
