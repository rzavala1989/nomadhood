# Seed Data and Pagination Design

## Problem

The app has 5 neighborhoods, 5 reviews from one user, and Prev/Next pagination. It feels empty. It needs realistic data density and proper page navigation.

## Seed Data

### Neighborhoods (~50)

Real US neighborhoods across ~12 cities: NYC, SF, LA, Chicago, Seattle, Austin, Denver, Portland, Miami, Nashville, Brooklyn, DC. Real names, coordinates, zip codes. Descriptions are terse, opinionated, written from a nomad's perspective (wifi quality, cafe density, noise, walkability).

### Users (~10)

Fake users with realistic names. `createdAt` staggered over the past 6 months so the review trend chart and activity feed have data to show.

### Reviews (~250)

3-8 reviews per neighborhood, randomly distributed. Ratings skew 3-5 (nomads leave bad places, they don't review them). Comments are short and specific: some mention wifi, cafes, noise, cost. Some reviews are rating-only with no comment. `createdAt` spread across the last 6 months.

### Favorites (~80)

2-5 favorites per user, scattered across neighborhoods. `position` values set for drag-and-drop ordering.

### Implementation

- All IDs are deterministic (hardcoded UUIDs) so the script is idempotent via `upsert`
- Single file: `prisma/seed.ts`
- Run via `bun run db:seed` or automatically during `prisma db reset`

## Numbered Pagination

### Page Size Selector

Three options: 10, 20, 50. Default: 10.

### Page Number Bar

- Prev/Next arrow buttons flanking page numbers
- Page numbers with ellipsis for gaps: `1 2 3 ... 5`
- Current page: white-on-black (inverse element, matching button style)
- Other pages: ghost text, hover to secondary

### URL Sync

Page and pageSize stored as URL query params (`?page=2&pageSize=20`) so pages are bookmarkable and shareable. Filters (search, city, state, sort) already reset offset; they will reset page to 1.

### "Showing X-Y of Z"

Retained from current implementation.

### Backend

No changes needed. The server already supports `offset` and `limit` parameters. The client computes `offset = (page - 1) * pageSize`.

## Files Affected

| File | Change |
|------|--------|
| `prisma/seed.ts` | Rewrite with ~50 neighborhoods, ~10 users, ~250 reviews, ~80 favorites |
| `src/pages/neighborhoods/index.tsx` | Replace Prev/Next with numbered pagination, add page size selector, sync to URL query params |
| `src/components/pagination.tsx` | New: reusable pagination component |
