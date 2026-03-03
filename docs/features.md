# Features

Everything that is built and working.

## Interactive Map

Split-view on the neighborhoods browse page (`/neighborhoods`). MapLibre GL with react-map-gl, tiles from MapTiler (free tier) or CartoDB Positron fallback. Markers at neighborhood lat/lon coordinates, popup cards on click. Mobile toggle between map and list views. Detail pages show a focused single-neighborhood map.

Components: `neighborhood-map.tsx`, `neighborhood-map-wrapper.tsx` (dynamic import, SSR disabled)

## Neighborhood Browse and Filter

Browse all neighborhoods at `/neighborhoods`. Sort by: newest, oldest, name A-Z, name Z-A, most reviews, most favorites. Filter by US state via dropdown. Search by name. Pagination.

tRPC: `neighborhoods.list` (accepts `sortBy`, `state`, `search`, and `page` inputs)

## Neighborhood Detail

`/neighborhoods/[id]`: full neighborhood info, interactive map, rating stats (average and distribution chart), review list, review form, similar neighborhoods section, and Nomad Score badge.

## Reviews

Authenticated users can create one review per neighborhood (1-5 star rating and optional comment). Edit and delete own reviews. Rating distribution displayed as a horizontal bar chart (recharts). Review stats: total count, average rating, and distribution breakdown.

Components: `review-form.tsx`, `star-rating.tsx`, `rating-distribution-chart.tsx`

## Favorites

Toggle favorite on any neighborhood card or detail page. Favorites page (`/favorites`) with drag-and-drop reordering via @dnd-kit. Position persists to database. Toast notifications on add/remove.

tRPC: `favorites.toggle`, `favorites.getMine`, `favorites.isFavorite`, `favorites.reorder`

## Nomad Score

Composite score (0-100) per neighborhood. Weighted: average rating (50%), review count (30%), and favorite count (20%), normalized against all neighborhoods. Displayed as a badge on neighborhood cards and detail pages. Sortable on browse page.

tRPC: `neighborhoods.getWithScores`

## Neighborhood Comparison

Select up to 3 neighborhoods for side-by-side comparison. Floating bottom bar appears when 2 or more are selected. Compare page (`/compare`) shows ratings, review counts, favorites, and rating distribution charts side by side.

Components: `comparison-bar.tsx`, `comparison-context.tsx`

## Dashboard

Authenticated landing page (`/dashboard`). Four stat cards (total neighborhoods, reviews, favorites, average rating). Review trend area chart (last 6 months). Top neighborhoods bar chart (by average rating, minimum 2 reviews). Activity feed (20 most recent reviews across all neighborhoods). Recent neighborhoods grid.

Components: `section-cards.tsx`, `activity-feed.tsx`, `review-trend-chart.tsx`, `top-neighborhoods-chart.tsx`

## Admin Panel

Accessible to users with `isAdmin: true`. Three management pages:

- `/admin/users`: view all users, promote/demote admin, delete accounts
- `/admin/neighborhoods`: create, edit, and delete neighborhoods with inline forms
- `/admin/reviews`: view all reviews, admin delete

Protected by `AdminLayout` component that checks `isAdmin` and redirects non-admins. Admin link appears conditionally in the sidebar.

## Public User Profiles

`/users/[id]`: public profile showing avatar, name, member since, review count, and favorite count. Tabbed view of user's reviews and favorites with linked neighborhoods. Author names are clickable throughout the app.

tRPC: `user.getPublicProfile`

## Authentication

GitHub OAuth via Auth.js v5. Single sign-in button at `/auth/signin`. Session stored in database. See [authentication.md](authentication.md) for details.

## Toast Notifications

sonner toasts on all mutations: favorite toggle, review create/update/delete, and profile update. Styled to match the monochrome design system.

## Similar Neighborhoods

On each neighborhood detail page, a "Similar Neighborhoods" section shows other neighborhoods in the same city or state. Uses the `neighborhoods.getSimilar` procedure.
