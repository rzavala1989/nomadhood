# Changelog

## [Unreleased]

### Added
- Walk Score integration: service layer fetches and caches Walk Score, Transit Score, and Bike Score from the Walk Score API (60-day TTL). Admin mutation to bulk-refresh all neighborhoods.
- `NeighborhoodDataPanel` component renders Walk Score data on the neighborhood detail page with score bars and descriptions.
- `dataRouter` tRPC router exposes `data.getAll`, `data.getWalkScore`, and `data.fetchWalkScores` (admin).
- Rentcast integration: service fetches and caches median rent, rent/sqft, sale price, and sale/sqft per ZIP code from the Rentcast API (30-day TTL). Monthly call cap enforced at 45 calls with a persistent tracker. Admin mutations for bulk refresh and usage reporting.
- FBI crime data integration: service queries the FBI Crime Data API for violent and property crime rates per 100k residents by city/state (90-day TTL). Fuzzy agency matching favors police department records. `CrimeDataCard` displays risk level, rates, and data year.
- `RentDataCard` and `CrimeDataCard` components added to `NeighborhoodDataPanel`.
- BLS cost-of-living integration: service fetches CPI index and median hourly wage from the Bureau of Labor Statistics API by metro area (CPI 30-day TTL, wages 180-day TTL). `CostOfLivingCard` displays CPI index and annualized median wage. Admin mutation for bulk refresh.
- Eventbrite local events integration: service fetches upcoming events by city via hardcoded org/venue IDs (24-hour TTL). `EventsCard` shows event count and up to 3 upcoming events with name, date, and free flag. Admin mutation for bulk refresh.
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