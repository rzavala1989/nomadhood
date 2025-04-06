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
├── app/                # Next.js app directory
│   ├── api/           # API routes
│   ├── components/     # Reusable components
|   ├── hooks/          # Custom hooks
│   ├── lib/           # Utility functions
│   ├── middleware/     # Middleware functions
│   ├── pages/          # Page components
│   ├── server/         # Server-side code
│   ├── styles/         # Global styles
│   ├── types/          # Type definitions
│   ├── utils/          # Utility functions

```
TODO / In Progress
🗺️ Add Mapbox GL for geospatial UX

🏘️ CRUD for neighborhoods

📝 Reviews system

❤️ Favorites

🛡️ Role-based admin dashboard

📈 Analytics (per neighborhood + user)

🪪 Profile pages

🌍 Search and filters

🧪 Unit & E2E testing with Vitest + Playwright
