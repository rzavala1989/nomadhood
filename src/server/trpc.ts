/**
 * This is your entry point to setup the root configuration for tRPC on the server.
 * - `initTRPC` should only be used once per app.
 * - We export only the functionality that we use so we can enforce which base procedures should be used
 *
 * Learn how to create protected base procedures and other things below:
 * @see https://trpc.io/docs/v11/router
 * @see https://trpc.io/docs/v11/procedures
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { transformer } from '~/utils/transformer';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/v11/data-transformers
   */
  transformer,

  /**
   * @see https://trpc.io/docs/v11/error-formatting
   */
  errorFormatter({ shape }) {
    return shape;
  },
});

/**
 * Auth middleware
 * Checks if `ctx.user` exists (injected in `createContext`)
 */
export const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      user: ctx.user,
    },
  });
});


/**
 * Admin middleware
 * Checks if `ctx.user` exists and is an admin
 */

const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user?.isAdmin) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access only' });
  }

  return next({ ctx });
});



/**
 * Create a router
 * @see https://trpc.io/docs/v11/router
 */
export const router = t.router;

/**
 * Create an unprotected procedure
 * @see https://trpc.io/docs/v11/procedures
 **/
export const publicProcedure = t.procedure;


/**
 * Admin procedure
 * Requires valid `ctx.user` and `ctx.user.isAdmin`
 */
export const adminProcedure = t.procedure.use(isAuthed).use(isAdmin); // 👈 this line right here


/**
 * Protected procedure
 * Requires valid `ctx.user`
 */
export const protectedProcedure = t.procedure.use(isAuthed);

/**
 * Merge multiple routers together
 * @see https://trpc.io/docs/v11/merging-routers
 */
export const mergeRouters = t.mergeRouters;

/**
 * Create a server-side caller
 * @see https://trpc.io/docs/v11/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;
