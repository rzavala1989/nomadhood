import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter} from "~/server/routers/_app.ts";

export const api = createTRPCReact<AppRouter>();
