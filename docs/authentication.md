# Authentication

Auth.js v5 (`next-auth@5.0.0-beta`) with the Prisma adapter. GitHub OAuth only.

## Configuration

`src/auth.ts` exports `handlers`, `auth`, `signIn`, and `signOut`.

```
GitHub OAuth -> Auth.js -> PrismaAdapter -> PostgreSQL
```

The Auth.js API route lives at `src/app/api/auth/[...nextauth]/route.ts` (App Router) while the rest of the app uses Pages Router.

## GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create an OAuth App
3. Set Homepage URL to `http://localhost:3000`
4. Set Authorization callback URL to `http://localhost:3000/api/auth/callback/github`
5. Copy Client ID and Client Secret to `.env`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_CLIENT_ID` | yes | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | yes | GitHub OAuth app client secret |
| `AUTH_SECRET` | yes | Minimum 32 chars. Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | no | Base URL (defaults to `http://localhost:3000`) |

Auth.js v5 uses `AUTH_SECRET`, not `NEXTAUTH_SECRET`.

## Session

Auth.js creates a database session (not JWT). The session token is stored as a cookie:

- HTTP: `authjs.session-token`
- HTTPS: `__Secure-authjs.session-token`

### Session Object

```ts
session.user = {
  id: string;       // User.id from database
  email: string;
  name?: string;
  image?: string;
  isAdmin: boolean;  // from User.isAdmin field
}
```

The `isAdmin` field is added via the `session` callback in `src/auth.ts`. It reads the value from the database User record set via the adapter.

## tRPC Context Integration

The tRPC context (`src/server/context.ts`) does not call `auth()`. Instead, it:

1. Reads the session token cookie from the request
2. Looks up the Session record in the database via Prisma
3. Loads the associated User
4. Makes `ctx.session` and `ctx.user` available to procedures

This avoids importing Auth.js into the tRPC server context.

## Access Levels

Defined in `src/server/trpc.ts`:

- **publicProcedure**: no authentication check
- **protectedProcedure**: requires `ctx.session` to exist, throws `UNAUTHORIZED` otherwise
- **adminProcedure**: requires `ctx.user.isAdmin === true`, throws `FORBIDDEN` otherwise

## Admin Roles

The `isAdmin` flag lives on the `User` model in the database. There is no self-service admin promotion. To make a user an admin:

```bash
bun run prisma-studio
# Find the user, then set isAdmin to true
```

Or via the admin panel (if you are already an admin): `/admin/users` has promote/demote actions.

## Sign-In Flow

1. User visits `/auth/signin`
2. Clicks "Continue with GitHub"
3. Redirected to GitHub OAuth consent screen
4. GitHub redirects back to `/api/auth/callback/github`
5. Auth.js creates or updates User and Account records via Prisma adapter
6. Session created in database, cookie set
7. User redirected to `/dashboard`

## Custom Pages

Auth.js is configured with `pages: { signIn: '/auth/signin' }` to use the custom sign-in page instead of the default.
