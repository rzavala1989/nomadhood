# Development

## Prerequisites

- Node.js 18 or newer
- [Bun](https://bun.sh) (package manager and runtime)
- PostgreSQL database ([Neon](https://neon.tech) free tier works)
- GitHub OAuth app ([create one](https://github.com/settings/developers))

## Setup

```bash
git clone <repo-url> && cd nomadhood
bun install
cp .env.example .env
```

Fill in `.env` (see Environment Variables below), then:

```bash
bun run migrate-dev    # create database tables and generate Prisma client
bun run db:seed        # optional: populate with sample data
bun dev                # http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | PostgreSQL connection string with `?sslmode=require` |
| `GITHUB_CLIENT_ID` | yes | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | yes | GitHub OAuth app client secret |
| `AUTH_SECRET` | yes | Min 32 chars. Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | no | Base URL, defaults to `http://localhost:3000` |
| `NEXT_PUBLIC_MAPTILER_KEY` | no | MapTiler API key for map tiles. Falls back to CartoDB Positron |
| `ADMIN_EMAIL` | no | Email address to auto-promote as admin |

Validated at build time by `src/server/env.ts` (Zod schema). Invalid vars fail the build.

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `bun dev` | Start Next.js dev server |
| `dev:migrate` | `bun run dev:migrate` | Run migrations then start dev server |
| `build` | `bun run build` | Production build |
| `start` | `bun run start` | Start production server |
| `migrate-dev` | `bun run migrate-dev` | Create and apply migration (prompts for name) |
| `migrate` | `bun run migrate` | Apply pending migrations (production) |
| `db-reset` | `bun run db-reset` | Reset database (destructive) |
| `generate` | `bun run generate` | Regenerate Prisma client |
| `prisma-studio` | `bun run prisma-studio` | Open Prisma Studio GUI |
| `db:seed` | `bun run db:seed` | Seed sample data |
| `type-check` | `bun run type-check` | TypeScript type checking (`tsc --noEmit`) |
| `lint` | `bun run lint` | ESLint check |
| `lint-fix` | `bun run lint-fix` | ESLint auto-fix |
| `format` | `bun run format` | Prettier format all files |
| `test-unit` | `bun run test-unit` | Run unit tests (Vitest) |
| `test-e2e` | `bun run test-e2e` | Run end-to-end tests (Playwright) |
| `test-start` | `bun run test-start` | Run unit then e2e tests |

## Tooling

**TypeScript**: strict mode, `@/*` path alias maps to `src/*`.

**ESLint**: v9 flat config with Next.js, React, and React Hooks plugins. Cached.

**Prettier**: with `prettier-plugin-tailwindcss` for class sorting.

**Vitest**: unit testing. Config in `vite.config.ts` or `vitest.config.ts`.

**Playwright**: end-to-end testing.

## Making a User Admin

No self-service admin flow. Two methods:

1. **Prisma Studio**: `bun run prisma-studio` -> find user -> set `isAdmin` to true
2. **Admin panel**: if you are already admin, go to `/admin/users` and use the promote action

## Map Tiles

The interactive map uses [MapLibre GL](https://maplibre.org/) with [MapTiler](https://www.maptiler.com/) tiles. The free tier gives 100K tile loads per month.

1. Sign up at [MapTiler Cloud](https://cloud.maptiler.com/)
2. Create an API key
3. Set `NEXT_PUBLIC_MAPTILER_KEY` in `.env`

Without a key, the map falls back to CartoDB Positron tiles (no signup required, limited style options).

## Adding a Feature

Typical flow for a new feature:

1. **Schema**: edit `prisma/schema.prisma`, run `bun run migrate-dev`
2. **Router**: add tRPC procedure in `src/server/routers/`
3. **Page or Component**: add to `src/pages/` or `src/components/`
4. **Hook**: use `trpc.routerName.procedureName.useQuery()` or `.useMutation()`

See [architecture.md](architecture.md) for the full tRPC router map and data flow.
