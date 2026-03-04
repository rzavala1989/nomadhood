# Changelog

## [Unreleased]

### Added
- Walk Score integration: service layer fetches and caches Walk Score, Transit Score, and Bike Score from the Walk Score API (60-day TTL). Admin mutation to bulk-refresh all neighborhoods.
- `NeighborhoodDataPanel` component renders Walk Score data on the neighborhood detail page with score bars and descriptions.
- `dataRouter` tRPC router exposes `data.getAll`, `data.getWalkScore`, and `data.fetchWalkScores` (admin).
- Numbered pagination component: reusable `Pagination` component with page numbers, prev/next, and ellipsis. Syncs `page` and `pageSize` to URL query params. Wired into the neighborhoods browse page.
- Seed script rewrite: 50 neighborhoods across 10 US cities, 10 users, 266 reviews, 89 favorites with realistic score distributions.
- Neighborhood boundary polygons: `boundary` Json field on `Neighborhood` model. Boundaries for 37/41 neighborhoods sourced from city open data portals and OSM Nominatim. Rendered as subtle fill/outline overlays on the map.
- Redesigned map pins: small circular dots with hover scale and active glow, replacing blocky square markers.

### Changed
- Map default bounds widened to show all US neighborhoods.
- Boundary polygon colors use dark values (`#050505`) for legibility on light basemap tiles.
- Removed Census TIGER/Line shapefiles (~1.55 GB) from repo; added gitignore pattern to prevent re-adding.

### Fixed
- Boundary polygon visibility on CartoDB Positron / MapTiler light tiles.