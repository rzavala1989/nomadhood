# Database

PostgreSQL via Prisma v6. Schema at `prisma/schema.prisma`.

## Models

### User

Primary user record. Created automatically on first OAuth sign-in via the Auth.js Prisma adapter.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | primary key |
| email | VARCHAR(255) | unique |
| name | VARCHAR(100) | nullable, from GitHub profile |
| image | VARCHAR(500) | nullable, avatar URL |
| isAdmin | Boolean | default false, set manually |
| emailVerified | DateTime | nullable |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

Indexes: `email`, `isAdmin`

Relations: has many Accounts, Sessions, Reviews, Favorites

### Neighborhood

A reviewable neighborhood.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | primary key |
| name | VARCHAR(100) | |
| city | VARCHAR(50) | |
| state | CHAR(2) | US state abbreviation |
| zip | VARCHAR(10) | |
| description | TEXT | nullable |
| latitude | Float | nullable, for map pins |
| longitude | Float | nullable, for map pins |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

Indexes: `(city, state)`, `zip`, `(latitude, longitude)`

Relations: has many Reviews, Favorites

### Review

A user's rating and optional comment for a neighborhood. One review per user per neighborhood.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | primary key |
| rating | SmallInt | 1-5 |
| comment | TEXT | nullable |
| userId | UUID | FK to User (cascade delete) |
| neighborhoodId | UUID | FK to Neighborhood (cascade delete) |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

Indexes: `neighborhoodId`, `userId`, `rating`

Unique constraint: `(userId, neighborhoodId)`

### Favorite

A saved neighborhood with drag-and-drop ordering.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | primary key |
| position | Int | default 0, for drag-and-drop ordering |
| userId | UUID | FK to User |
| neighborhoodId | UUID | FK to Neighborhood |
| createdAt | DateTime | auto |

Unique constraint: `(userId, neighborhoodId)`

### Auth Models (managed by Auth.js adapter)

**Account**: OAuth provider connections. Links User to GitHub (or other providers).

**Session**: Active sessions with expiry. Session token is stored as a cookie and looked up directly by the tRPC context.

**VerificationToken**: Used for email verification flows. Unique on `(identifier, token)`.

## Commands

```bash
bun run migrate-dev     # create and apply migration (development)
bun run migrate         # apply pending migrations (production)
bun run db-reset        # reset database (destructive)
bun run generate        # regenerate Prisma client
bun prisma studio       # GUI database browser
bun run db:seed         # seed sample data (prisma/seed.ts)
```

## Seeding

`prisma/seed.ts` populates the database with sample neighborhoods, users, reviews, and favorites. Run with `bun run db:seed` or automatically via `bun prisma migrate reset`.

## Adding a Migration

1. Edit `prisma/schema.prisma`
2. Run `bun run migrate-dev`. Prisma prompts for a migration name.
3. Prisma generates SQL in `prisma/migrations/` and applies it.
4. Prisma client is regenerated automatically.
