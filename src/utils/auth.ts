import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/server/prisma';
import { NextAuthOptions } from 'next-auth'; // adjust path if needed
import GitHubProvider from 'next-auth/providers/github';
import EmailProvider from 'next-auth/providers/email';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma), // ← 🔥 this is required!
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    EmailProvider({
      from: 'onboarding@resend.dev', // TODO: change this to our domain
      async sendVerificationRequest({ identifier, url }) {
        const { error } = await resend.emails.send({
          from: 'onboarding@resend.dev', //TODO: change this to our domain
          to: [identifier],
          subject: 'Your Magic Link ✨',
          html: `
            <p>Hey there!</p>
            <p>Click <a href="${url}">here</a> to sign in to Nomadhood.</p>
            <p>This link will expire soon.</p>
          `,
        });

        if (error) {
          console.error('❌ Failed to send magic link', error);
          throw new Error('Email send failed');
        }
      },
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      session.user.isAdmin = session.user.email === 'zavala.ricardo.m@gmail.com';
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
