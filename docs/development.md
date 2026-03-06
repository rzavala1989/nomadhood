# Development

## Prerequisites

- Node.js 18+
- [Bun](https://bun.sh) (package manager and runtime)
- PostgreSQL ([Neon](https://neon.tech) free tier works)
- GitHub OAuth app ([create one](https://github.com/settings/developers))

## Setup

```bash
git clone <repo-url> && cd nomadhood
bun install
cp .env.example .env
```

Fill in `.env` (see below), then:

```bash
bun run migrate-dev    # create tables, generate Prisma client
bun run db:seed        # optional: sample data
bun dev                # http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | PostgreSQL connection string with `?sslmode=require` |
| `GITHUB_CLIENT_ID` | yes | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | yes | GitHub OAuth client secret |
| `AUTH_SECRET` | yes | Min 32 chars. `openssl rand -base64 32` |
| `NEXTAUTH_URL` | no | Base URL, defaults to `http://localhost:3000` |
| `NEXT_PUBLIC_MAPTILER_KEY` | no | MapTiler tiles. Falls back to CartoDB Positron |
| `ADMIN_EMAIL` | no | Email to auto-promote as admin |
| `WALKSCORE_API_KEY` | no | Walk Score API (5,000/day) |
| `RENTCAST_API_KEY` | no | Rentcast API (50/month, capped at 45) |
| `FBI_CRIME_DATA_API_KEY` | no | FBI Crime Data Explorer |
| `BLS_API_KEY` | no | BLS v2 (higher rate limits) |
| `EVENTBRITE_API_KEY` | no | Eventbrite private token |
| `UNSPLASH_ACCESS_KEY` | no | Unsplash API for images |
| `NEWSDATA_IO_API_KEY` | no | newsdata.io (200/day free tier) |
| `CRON_SECRET` | no | Secures `/api/cron/fetch-data` |

Validated at build time by `src/server/env.ts` (Zod). Invalid vars fail the build.

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `bun dev` | Start dev server |
| `dev:migrate` | `bun run dev:migrate` | Migrate then start dev |
| `build` | `bun run build` | Production build |
| `start` | `bun run start` | Start production server |
| `migrate-dev` | `bun run migrate-dev` | Create and apply migration |
| `migrate` | `bun run migrate` | Apply pending migrations (prod) |
| `db-reset` | `bun run db-reset` | Reset database (destructive) |
| `generate` | `bun run generate` | Regenerate Prisma client |
| `prisma-studio` | `bun run prisma-studio` | Prisma Studio GUI |
| `db:seed` | `bun run db:seed` | Seed sample data |
| `type-check` | `bun run type-check` | TypeScript check (`tsc --noEmit`) |
| `lint` | `bun run lint` | ESLint check |
| `lint-fix` | `bun run lint-fix` | ESLint auto-fix |
| `format` | `bun run format` | Prettier format |
| `test-unit` | `bun run test-unit` | Vitest unit tests |
| `test-e2e` | `bun run test-e2e` | Playwright e2e tests |

## Tooling

**TypeScript**: strict mode, `@/*` path alias maps to `src/*`.

**ESLint**: v9 flat config with Next.js, React, React Hooks plugins. Cached.

**Prettier**: with `prettier-plugin-tailwindcss` for class sorting.

**Vitest**: unit testing.

**Playwright**: end-to-end testing.

## Making a User Admin

1. **Prisma Studio**: `bun run prisma-studio` -> find user -> set `isAdmin` to true
2. **Admin panel**: if already admin, `/admin/users` has promote/demote

## Map Tiles

[MapLibre GL](https://maplibre.org/) with [MapTiler](https://www.maptiler.com/) tiles (100K loads/month free).

1. Sign up at [MapTiler Cloud](https://cloud.maptiler.com/)
2. Create API key
3. Set `NEXT_PUBLIC_MAPTILER_KEY` in `.env`

Without a key, falls back to CartoDB Positron tiles (no signup, limited styles).

## Adding a Feature

1. **Schema**: edit `prisma/schema.prisma`, run `bun run migrate-dev`
2. **Service** (if external data): add to `src/server/services/`
3. **Router**: add tRPC procedure in `src/server/routers/`
4. **Page or Component**: add to `src/pages/` or `src/components/`
5. **Hook up**: use `trpc.routerName.procedureName.useQuery()` or `.useMutation()`

See [architecture.md](architecture.md) for the full tRPC router map.
