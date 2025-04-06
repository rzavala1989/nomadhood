import type * as trpcNext from '@trpc/server/adapters/next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';

export async function createContext(opts: trpcNext.CreateNextContextOptions) {
  const session = await getServerSession(opts.req, opts.res, authOptions);

  return {
    user: session?.user ?? null,
    isAdmin: session?.user?.isAdmin ?? false,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
