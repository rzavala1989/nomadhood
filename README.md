# Nomadhood

Neighborhood discovery and review platform for digital nomads. Data-backed neighborhood intel from people who actually lived there.

## Quickstart

```bash
git clone <repo-url> && cd nomadhood
cp .env.example .env           # fill in credentials
bun install
bun run migrate-dev            # run migrations, generate Prisma client
bun run db:seed                # optional: sample data
bun dev                        # http://localhost:3000
```

Requires Node 18+, Bun, PostgreSQL ([Neon](https://neon.tech) free tier works).

## Stack

Next.js 15 (Pages Router) / React 19 / tRPC v11 / Prisma v6 / Auth.js v5 / PostgreSQL / Tailwind and shadcn/ui

## Docs

| Document | Covers |
|----------|--------|
| [Architecture](docs/architecture.md) | Stack, directory layout, data flow, tRPC router map |
| [Database](docs/database.md) | Prisma models, relationships, cache tables, migrations |
| [Authentication](docs/authentication.md) | GitHub OAuth, sessions, admin roles, cookie handling |
| [Features](docs/features.md) | All user-facing features with key files and tRPC procedures |
| [Data Pipeline](docs/data-pipeline.md) | External APIs, news intelligence, cron jobs, cache strategy |
| [Development](docs/development.md) | Env vars, scripts, tooling, adding features |

## Project Structure

```
src/
  pages/           Next.js pages (Pages Router)
  components/      React components (ui/, dashboard/, auth/, landing/)
  server/          tRPC routers, services, constants, Prisma client
  contexts/        React context providers
  hooks/           Custom React hooks
  styles/          Global CSS and design tokens
  utils/           tRPC client, helpers
  types/           TypeScript type extensions
prisma/
  schema.prisma    Database schema
  seed.ts          Sample data seeder
  migrations/      Migration history
docs/              Project documentation
```

## TODOs

- [ ] Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to Vercel environment variables to enable Google OAuth in production

## License

Private.
