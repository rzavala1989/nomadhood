# 🏡 Nomadhood

**Nomadhood** is a fullstack TypeScript web application designed to help users explore, review, and save their favorite neighborhoods. It's built with bleeding-edge tools for speed, flexibility, and DX excellence.

---

## 🚀 Tech Stack

| Layer       | Tech                                                                 |
|-------------|----------------------------------------------------------------------|
| Frontend    | React (Next.js 15), TypeScript, TailwindCSS, shadcn/ui               |
| Backend     | tRPC, Prisma ORM, PostgreSQL (local)                                 |
| Auth        | NextAuth.js with GitHub provider + session customization             |
| Database    | PostgreSQL (managed via Prisma, local development via pgAdmin)       |
| Dev Tools   | Bun, ESLint, Prettier, Vitest, Playwright                            |
| Infra       | Vercel (frontend), Fly.io (optional backend), GitHub Actions (CI/CD) |

---

## 🔒 Authentication

Powered by [NextAuth.js](https://next-auth.js.org/), users authenticate via GitHub (with optional role-based access control for admin routes).

Session includes:
```ts
session.user = {
  id: string;
  email: string;
  isAdmin?: boolean;
}
```

## Directory Structure

```bash
src/
├── components/         # Reusable UI components
│   ├── ui/            # shadcn/ui components
│   ├── auth/          # Authentication components
│   └── landing/       # Landing page components
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
├── pages/             # Next.js pages (Pages Router)
│   ├── api/           # API routes
│   ├── auth/          # Authentication pages
│   └── _app.tsx       # App wrapper
├── server/            # Server-side code
│   ├── routers/       # tRPC routers
│   ├── context.ts     # tRPC context
│   ├── env.ts         # Environment validation
│   ├── prisma.ts      # Database client
│   └── trpc.ts        # tRPC setup
├── styles/            # Global styles
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```
## 🚀 Features

### ✅ Implemented
- **Authentication**: GitHub OAuth + Magic Link email authentication
- **User Management**: Profile management with admin role system
- **Neighborhoods**: CRUD operations with search, filtering, and pagination
- **Reviews**: Complete review system with ratings and statistics
- **Favorites**: Save and manage favorite neighborhoods
- **Dashboard**: Interactive analytics dashboard with charts
- **Database**: Optimized schema with proper indexes and constraints

### 🚧 In Progress
- **Admin Dashboard**: Management interface for neighborhoods and reviews
- **Enhanced UI**: Neighborhood browsing and detail pages
- **Testing**: Comprehensive unit and E2E test coverage

### 📋 Planned Features
- **🗺️ Mapbox Integration**: Interactive maps with geospatial data
- **📈 Advanced Analytics**: Per-neighborhood and user analytics
- **🪪 Profile Pages**: Public user profiles and activity feeds
- **🔍 Advanced Search**: Location-based search with filters
- **📱 Mobile Optimization**: Progressive Web App features
