# Authentication

Auth.js v5 (`next-auth@5.0.0-beta`) with the Prisma adapter. GitHub OAuth only.

## Configuration

`src/auth.ts` exports `handlers`, `auth`, `signIn`, `signOut`.

```
GitHub OAuth -> Auth.js -> PrismaAdapter -> PostgreSQL
```

The Auth.js API route lives at `src/app/api/auth/[...nextauth]/route.ts` (App Router) while the rest of the app uses Pages Router.

## GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create an OAuth App
3. Homepage URL: `http://localhost:3000`
4. Callback URL: `http://localhost:3000/api/auth/callback/github`
5. Copy Client ID and Client Secret to `.env`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_CLIENT_ID` | yes | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | yes | GitHub OAuth app client secret |
| `AUTH_SECRET` | yes | Min 32 chars. Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | no | Base URL (defaults to `http://localhost:3000`) |

Auth.js v5 uses `AUTH_SECRET`, not `NEXTAUTH_SECRET`.

## Session

Database sessions (not JWT). Token stored as cookie:
- HTTP: `authjs.session-token`
- HTTPS: `__Secure-authjs.session-token`

Session object shape:
```ts
session.user = {
  id: string;
  email: string;
  name?: string;
  image?: string;
  isAdmin: boolean;
}
```

`isAdmin` is injected via the `session` callback in `src/auth.ts`.

## tRPC Context Integration

`src/server/context.ts` does not call `auth()`. Instead:
1. Reads session token cookie from the request
2. Looks up Session record in DB via Prisma
3. Loads associated User
4. Makes `ctx.session` and `ctx.user` available to procedures

This avoids importing Auth.js into the tRPC server context.

## Access Levels

Defined in `src/server/trpc.ts`:
- **publicProcedure**: no auth check
- **protectedProcedure**: requires `ctx.user`, throws `UNAUTHORIZED`
- **adminProcedure**: requires `ctx.user.isAdmin`, throws `FORBIDDEN`

## Admin Roles

`isAdmin` lives on the User model. No self-service promotion. Two methods:
1. **Prisma Studio**: `bun run prisma-studio`, find user, set `isAdmin` to true
2. **Admin panel**: `/admin/users` has promote/demote actions (requires existing admin)

## Sign-In Flow

1. User visits `/auth/signin`
2. Clicks "Continue with GitHub"
3. Redirected to GitHub OAuth consent screen
4. GitHub redirects to `/api/auth/callback/github`
5. Auth.js creates/updates User and Account via Prisma adapter
6. Session created in DB, cookie set
7. Redirected to `/dashboard`

Custom sign-in page configured via `pages: { signIn: '/auth/signin' }`.
