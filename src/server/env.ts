/**
 * This file is included in `/next.config.ts` which ensures the app isn't built with invalid env vars.
 * It has to be a `.js`-file to be imported there.
 */

import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // App Environment
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().default(3000),

  // Auth
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url().optional(),

  // OAuth Providers
  GITHUB_CLIENT_ID: z.string().min(1, 'GITHUB_CLIENT_ID is required'),
  GITHUB_CLIENT_SECRET: z.string().min(1, 'GITHUB_CLIENT_SECRET is required'),

  // Email Service
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),

  // Admin Configuration
  ADMIN_EMAIL: z.string().email('ADMIN_EMAIL must be a valid email').optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:');
  console.error(_env.error.format());
  throw new Error(
    '❌ Invalid environment variables: ' +
      JSON.stringify(_env.error.format(), null, 2),
  );
}

export const env = _env.data;
