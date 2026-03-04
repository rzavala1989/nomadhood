# Seed Data and Pagination Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Populate the database with ~50 real neighborhoods, ~10 users, ~250 reviews, and ~80 favorites, then replace Prev/Next pagination with numbered pages and a page size selector.

**Architecture:** Seed script is a standalone `prisma/seed.ts` with all data inline (no external files). Pagination is a new reusable component consumed by the neighborhoods index page. URL query params sync page and pageSize for bookmarkability.

**Tech Stack:** Prisma seed, Next.js Pages Router (useRouter for query params), React

---

### Task 1: Write the seed data arrays

**Files:**
- Modify: `prisma/seed.ts` (full rewrite)

**Step 1: Rewrite seed.ts with all data and seeding logic**

Replace the entire file. The seed script has four data arrays (neighborhoods, users, review comments, review/favorite generation) and seeds them in order with `upsert` for idempotency.

Key constraints:
- Review has `@@unique([userId, neighborhoodId])` so each user can only review a neighborhood once
- Favorite has `@@unique([userId, neighborhoodId])` same constraint
- All IDs must be deterministic UUIDs for idempotent upserts
- `createdAt` values spread across the last 6 months for chart data
- Neighborhoods need real coordinates for the map

The neighborhoods array should have ~50 entries across these cities:
- New York (6-7 neighborhoods: Greenwich Village, Williamsburg, Park Slope, Astoria, Upper West Side, Harlem, East Village)
- San Francisco (5: Mission District, Hayes Valley, Castro, Noe Valley, SOMA)
- Los Angeles (5: Silver Lake, Venice, Echo Park, Highland Park, Los Feliz)
- Chicago (4: Wicker Park, Logan Square, Lincoln Park, Pilsen)
- Seattle (3: Capitol Hill, Fremont, Ballard)
- Austin (4: East Austin, South Congress, Zilker, Hyde Park)
- Denver (3: RiNo, Capitol Hill, Highlands)
- Portland (3: Alberta Arts, Hawthorne, Pearl District)
- Miami (3: Wynwood, Coconut Grove, South Beach)
- Nashville (3: East Nashville, The Gulch, Germantown)
- Washington DC (3: Adams Morgan, Dupont Circle, Shaw)
- Philadelphia (3: Fishtown, Northern Liberties, Rittenhouse Square)

Each neighborhood needs: deterministic ID, name, city, state, zip, description (2-3 sentences, nomad perspective: wifi, cafes, walkability, noise, cost), latitude, longitude.

Users array: 10 users with deterministic IDs, realistic names, emails like `{firstname}@example.com`, `createdAt` staggered.

Review generation: iterate neighborhoods, for each randomly pick 3-8 users (using deterministic seed-based selection, not Math.random, so re-runs are stable). Ratings 3-5 weighted toward 4. Comments drawn from a pool of ~30 realistic nomad-style comments (some null for rating-only reviews). `createdAt` spread across last 6 months.

Favorite generation: iterate users, each gets 2-5 random neighborhoods as favorites with sequential `position` values.

**Step 2: Run the seed**

Run: `bun run db:seed`
Expected: Console output showing counts of created records. No errors.

**Step 3: Verify data in the app**

Open `http://localhost:3001/neighborhoods` and confirm:
- Multiple pages of neighborhoods visible
- Dashboard stats show realistic numbers
- Activity feed shows varied reviews from different users

**Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "expand seed data to ~50 neighborhoods, ~10 users, ~250 reviews"
```

---

### Task 2: Create the Pagination component

**Files:**
- Create: `src/components/pagination.tsx`

**Step 1: Build the component**

Props:
```ts
{
  currentPage: number;      // 1-indexed
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];  // default [10, 20, 50]
}
```

Layout (left to right):
- "Showing X-Y of Z" text (text-micro, text-ghost, tabular-nums)
- Page size selector: `Select` component with 10/20/50 options (text-micro)
- Page numbers: Prev arrow, page buttons with ellipsis, Next arrow

Page number logic:
- Always show first and last page
- Show current page and 1 neighbor on each side
- Use "..." for gaps
- Example with 10 pages, current=5: `< 1 ... 4 5 6 ... 10 >`
- Example with 5 pages, current=3: `< 1 2 3 4 5 >`

Styling (per CLAUDE.md design system):
- Current page: `bg-[--bg-inverse] text-[--text-inverse]` (white on black, the inverse button)
- Other pages: `surface-1 text-[--text-tertiary] hover:text-[--text-secondary] hover:bg-[--bg-surface-2]`
- Disabled prev/next: `opacity-30 cursor-not-allowed`
- All buttons: no border-radius, `text-[10px] uppercase tracking-[0.18em]`, padding `8px 12px`
- Gap between buttons: `gap-px` (1px grid gap)

**Step 2: Commit**

```bash
git add src/components/pagination.tsx
git commit -m "add reusable numbered pagination component"
```

---

### Task 3: Wire pagination into neighborhoods page

**Files:**
- Modify: `src/pages/neighborhoods/index.tsx`

**Step 1: Replace pagination state and wire up URL params**

Changes:
1. Remove `PAGE_SIZE` constant and `offset` state
2. Add `useRouter` for reading/writing query params
3. Derive `page` and `pageSize` from `router.query` (default page=1, pageSize=10)
4. Compute `offset = (page - 1) * pageSize` for the tRPC query
5. Replace filter `resetOffset()` with `resetPage()` that pushes `page=1` to router
6. Replace the inline Prev/Next buttons with the `<Pagination />` component
7. `onPageChange` pushes new page to `router.query`
8. `onPageSizeChange` pushes new pageSize and resets page to 1

URL format: `/neighborhoods?page=2&pageSize=20&sortBy=newest&state=CA`

Use `router.push` with `shallow: true` to avoid full page reloads. Preserve existing query params (search, city, state, sortBy) when changing page/pageSize.

The "Showing X-Y of Z" display moves into the Pagination component.

**Step 2: Verify**

- Navigate pages, confirm URL updates
- Change page size, confirm page resets to 1
- Apply filter, confirm page resets to 1
- Refresh on page 3, confirm it stays on page 3
- Check that map view still works alongside pagination

**Step 3: Commit**

```bash
git add src/pages/neighborhoods/index.tsx
git commit -m "wire numbered pagination with URL sync into neighborhoods page"
```
