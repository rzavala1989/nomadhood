import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/server/prisma';
import { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import EmailProvider from 'next-auth/providers/email';
import { Resend } from 'resend';
import { env } from '@/server/env';

const resend = new Resend(process.env.RESEND_API_KEY);

function createMagicLinkEmail(url: string, identifier: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sign in to Nomadhood</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        </style>
      </head>
      <body style="
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #374151;
        background-color: #f9fafb;
        margin: 0;
        padding: 20px 0;
      ">
        <div style="
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        ">
          <!-- Header -->
          <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 32px 24px;
            text-align: center;
          ">
            <div style="
              font-size: 28px;
              font-weight: 700;
              color: #ffffff;
              margin-bottom: 8px;
            ">🏡 Nomadhood</div>
            <div style="
              color: #e5e7eb;
              font-size: 14px;
              font-weight: 500;
            ">Discover Your Perfect Neighborhood</div>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 32px;">
            <div style="text-align: center;">
              <h1 style="
                font-size: 24px;
                font-weight: 700;
                color: #111827;
                margin-bottom: 16px;
              ">🔐 Your Sign-In Link</h1>
              
              <p style="
                font-size: 18px;
                color: #6b7280;
                margin-bottom: 32px;
                line-height: 1.6;
              ">
                Welcome back! Click the button below to securely sign in to your Nomadhood account.
              </p>

              <div style="margin-bottom: 32px;">
                <a href="${url}" style="
                  display: inline-block;
                  padding: 14px 28px;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: 600;
                  font-size: 16px;
                ">Sign In to Nomadhood</a>
              </div>

              <div style="
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 24px;
                text-align: left;
              ">
                <h2 style="
                  font-size: 16px;
                  margin-bottom: 12px;
                  color: #374151;
                  font-weight: 600;
                ">🛡️ Security Information</h2>
                <ul style="
                  margin: 0;
                  padding-left: 20px;
                  font-size: 14px;
                  color: #6b7280;
                  line-height: 1.6;
                ">
                  <li>This link will expire in <strong>24 hours</strong> for your security</li>
                  <li>The link can only be used once</li>
                  <li>This email was sent to: <strong>${identifier}</strong></li>
                  <li>If you didn't request this, you can safely ignore this email</li>
                </ul>
              </div>

              <p style="
                font-size: 14px;
                color: #9ca3af;
                margin-bottom: 8px;
              ">
                Having trouble with the button? Copy and paste this link into your browser:
              </p>
              <p style="
                font-size: 12px;
                color: #6b7280;
                word-break: break-all;
                background-color: #f9fafb;
                padding: 8px 12px;
                border-radius: 4px;
                border: 1px solid #e5e7eb;
                font-family: monospace;
              ">${url}</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="
            background-color: #f3f4f6;
            padding: 24px 32px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          ">
            <div style="
              font-size: 12px;
              color: #6b7280;
              line-height: 1.5;
            ">
              <p style="margin-bottom: 8px;">
                <strong>Nomadhood</strong> - Your neighborhood discovery platform
              </p>
              <p style="margin-bottom: 0;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    EmailProvider({
      from: 'Nomadhood <noreply@nomadhood.com>',
      async sendVerificationRequest({ identifier, url }) {
        const { error } = await resend.emails.send({
          from: 'Nomadhood <noreply@nomadhood.com>',
          to: [identifier],
          subject: '🔐 Your Nomadhood Sign-In Link',
          html: createMagicLinkEmail(url, identifier),
        });

        if (error) {
          console.error('❌ Failed to send magic link email:', error);
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
      session.user.isAdmin = env.ADMIN_EMAIL ? session.user.email === env.ADMIN_EMAIL : false;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
