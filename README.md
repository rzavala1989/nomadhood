# Nomadhood

Neighborhood discovery and review platform for digital nomads. Search, compare, and review neighborhoods with interactive maps, composite scoring, community reviews, and external data (walkability, housing costs, safety, wages, local events).

## Quickstart

```bash
git clone <repo-url> && cd nomadhood
cp .env.example .env           # fill in your credentials
bun install
bun run migrate-dev            # run migrations and generate client
bun dev                        # http://localhost:3000
```

Requires Node 18+, Bun, and a PostgreSQL database (Neon free tier works).

## Stack

Next.js 15 (Pages Router) / React 19 / tRPC v11 / Prisma v6 / Auth.js v5 / PostgreSQL / Tailwind and shadcn/ui


| Document | What it covers |
|----------|---------------|
| [Architecture](docs/architecture.md) | Tech stack, directory structure, tRPC router map, data flow |
| [Database](docs/database.md) | Prisma schema, models, relationships, migrations, seeding |
| [Authentication](docs/authentication.md) | GitHub OAuth, sessions, admin roles, cookie handling |
| [Features](docs/features.md) | All implemented features with descriptions |
| [Development](docs/development.md) | Setup, env vars, scripts, testing, tooling |

## Project Structure

```
src/
  pages/           Next.js pages (Pages Router)
  components/      React components
  server/          tRPC routers, Prisma client, auth context, external API services
  styles/          Global CSS and design tokens
  utils/           tRPC client, helpers
  contexts/        React context providers
  hooks/           Custom React hooks
  types/           TypeScript type extensions
prisma/
  schema.prisma    Database schema
  seed.ts          Sample data seeder
docs/              Detailed documentation
```

## License

Private.

