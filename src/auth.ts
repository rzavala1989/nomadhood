import NextAuth from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GitHub from 'next-auth/providers/github';
import Resend from 'next-auth/providers/resend';
import { prisma } from '@/server/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Cast needed: next-auth beta bundles its own @auth/core, causing duplicate types
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: 'onboarding@resend.dev',
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      // isAdmin comes from the DB User model via the adapter
      (session.user as typeof session.user & { isAdmin: boolean }).isAdmin =
        (user as typeof user & { isAdmin: boolean }).isAdmin ?? false;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
});
