# Features

Everything built and working.

## Neighborhood Browse and Map

Split-view on `/neighborhoods`. MapLibre GL with react-map-gl, tiles from MapTiler (CartoDB Positron fallback). Markers at lat/lon, popup cards on click. Sort by name, newest, most reviews, most favorites. Filter by state. Search by name. Paginated.

Key files: `pages/neighborhoods/index.tsx`, `neighborhood-map.tsx`, `neighborhood-map-wrapper.tsx`, `neighborhood-card.tsx`, `pagination.tsx`

tRPC: `neighborhoods.list`, `data.getImages`

## Neighborhood Detail

`/neighborhoods/[id]`: hero panel with image carousel, stat pills (walk score, safety, rent, wage), collapsible map, score cards (walkability, safety, cost of living), neighborhood pulse (news intelligence), local events, reviews with dimension ratings, about section, similar neighborhoods with images.

Key files: `pages/neighborhoods/[id].tsx`, `neighborhood-data-panel.tsx`, `neighborhood-pulse.tsx`, `similar-neighborhoods.tsx`, `rating-distribution-chart.tsx`

tRPC: `neighborhoods.getById`, `data.getAll`, `news.getPulse`, `reviews.getUserReview`

## Reviews and Dimensions

One review per user per neighborhood. 1-5 star overall rating, optional comment, and 6 dimension sub-ratings (wifi, safety, food, nightlife, walkability, cost/value). Edit and delete own reviews. Rating distribution chart.

Key files: `review-form.tsx`, `star-rating.tsx`, `rating-distribution-chart.tsx`

tRPC: `reviews.create`, `reviews.update`, `reviews.delete`, `reviews.getByNeighborhood`

## Favorites

Toggle favorite on any card or detail page. `/favorites` with drag-and-drop reordering via @dnd-kit. Position persists to DB. Toast on add/remove.

tRPC: `favorites.toggle`, `favorites.getMine`, `favorites.reorder`

## Nomad Score

Composite 0-100 score. Community-only formula (list pages): avg rating 50%, review count 30%, favorites 20%. Enhanced formula (detail page, when external data available): community 40%, walkability 15%, transit/bike 10%, safety 15%, affordability 20%.

Key files: `server/constants/scores.ts`, `server/utils/`

tRPC: `neighborhoods.getWithScores`

## Comparison Tool

Select up to 3 neighborhoods via compare button on cards. Floating bottom bar when 2+ selected. `/compare` shows side-by-side stats, ratings, external data, and rating distributions.

Key files: `comparison-bar.tsx`, `contexts/comparison-context.tsx`, `pages/compare.tsx`

## Dashboard

`/dashboard`: risk alerts (if logged in), stat cards (neighborhoods, reviews, favorites, avg rating), review trend chart, top neighborhoods chart, recent activity feed, news pulse (trending neighborhoods).

Key files: `pages/dashboard.tsx`, `section-cards.tsx`, `dashboard/activity-feed.tsx`, `dashboard/review-trend-chart.tsx`, `dashboard/top-neighborhoods-chart.tsx`, `dashboard/news-trending.tsx`, `dashboard/risk-alerts.tsx`

## News Intelligence

Three features powered by newsdata.io article caching and classification.

### Neighborhood Pulse

On detail pages. Classifies articles into 6 nomad signal categories (Infrastructure, Safety, Cost of Living, Food and Culture, Tech and Coworking, Community). Shows sentiment score, trend direction (improving/declining/stable via 7d vs 8-30d velocity), and categorized article list.

Key files: `neighborhood-pulse.tsx`, `server/constants/newsCategories.ts`, `server/services/newsdata.ts` (`getNeighborhoodPulse`)

tRPC: `news.getPulse`

### Trending Neighborhoods

On dashboard. Two-column grid showing "heating up" and "cooling down" neighborhoods based on news velocity (7d vs 30d article frequency) weighted by sentiment ratio. Minimum 2 articles to qualify.

Key files: `dashboard/news-trending.tsx`, `server/services/newsdata.ts` (`getNewsTrending`)

tRPC: `news.getTrending`

### Move-In Risk Alerts

For logged-in users. Generates alerts when favorited neighborhoods have 3+ negative articles in 7 days. Severity: "high" (5+) or "medium" (3-4). Idempotent daily via unique constraint. 90-day auto-cleanup. Unread badge in site header. Dismiss (mark read) per alert.

Key files: `dashboard/risk-alerts.tsx`, `site-header.tsx`, `server/services/newsAlerts.ts`

tRPC: `news.getAlerts`, `news.markRead`, `news.getUnreadCount`

## Personalized Recommendations

Computed on-demand when user visits recommendations. Builds a preference profile from highly-rated reviews (4+ stars), scores unreviewed neighborhoods by dimension similarity, walkability, rent, safety, and geography. Cached 24 hours.

tRPC: `recommendations.getForUser`

## Trend Snapshots

Weekly point-in-time snapshots of each neighborhood's scores, counts, and dimension averages. Created by cron on Sundays. Powers trend analysis.

Key files: `server/services/snapshots.ts`

tRPC: `trends.getSnapshots`, `trends.createSnapshot` (admin)

## External Data Pipeline

Six external APIs provide objective metrics. Fetched to DB cache via admin triggers or daily cron, never during user requests. See [data-pipeline.md](data-pipeline.md).

## Admin Panel

`/admin/*` pages for users with `isAdmin: true`:
- `/admin/users`: view all users, promote/demote admin, delete accounts
- `/admin/neighborhoods`: create, edit, delete neighborhoods
- `/admin/reviews`: view all reviews, admin delete
- `/admin/data`: fetch buttons per data source, Rentcast usage counter

Key files: `admin-layout.tsx`, `pages/admin/*.tsx`

## Public User Profiles

`/users/[id]`: avatar, name, member since, review count, favorites count. Tabbed view of reviews and favorites. Author names are clickable throughout the app.

tRPC: `user.getPublicProfile`

## Authentication

GitHub OAuth via Auth.js v5. See [authentication.md](authentication.md).

## Toast Notifications

sonner toasts on all mutations. Styled to match design system.
