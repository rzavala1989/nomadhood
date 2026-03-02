import type * as trpcNext from '@trpc/server/adapters/next';
import { prisma } from '@/server/prisma';

export async function createContext(opts: trpcNext.CreateNextContextOptions) {
  // Auth.js v5 session-token cookie (http: 'authjs.session-token', https: '__Secure-authjs.session-token')
  const sessionToken =
    opts.req.cookies['authjs.session-token'] ??
    opts.req.cookies['__Secure-authjs.session-token'];

  if (!sessionToken) {
    return { user: null, isAdmin: false };
  }

  const dbSession = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!dbSession || dbSession.expires < new Date()) {
    return { user: null, isAdmin: false };
  }

  return {
    user: dbSession.user,
    isAdmin: dbSession.user.isAdmin,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
