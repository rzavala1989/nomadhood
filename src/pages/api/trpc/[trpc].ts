/**
 * This file contains tRPC's HTTP response handler
 */
import * as trpcNext from '@trpc/server/adapters/next';
import { createContext } from '@/server/context';
import { appRouter } from '@/server/routers/_app';

export default trpcNext.createNextApiHandler({
  router: appRouter,
  /**
   * @see https://trpc.io/docs/v11/context
   */
  createContext,
  /**
   * @see https://trpc.io/docs/v11/error-handling
   */
  onError({ error, path, input, ctx, type, req }) {
    console.error(`❌ tRPC Error on \`${path ?? '<no-path>'}\`:`, {
      error: {
        message: error.message,
        code: error.code,
        cause: error.cause,
      },
      type,
      input,
      userId: ctx?.user?.id,
      userAgent: req?.headers?.['user-agent'],
    });

    // In production, you might want to send to error reporting service
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      // Example: Sentry, LogRocket, etc.
      // errorReporter.captureException(error);
    }
  },
  /**
   * @see https://trpc.io/docs/v11/caching#api-response-caching
   */
  // responseMeta() {
  //   // ...
  // },
});
