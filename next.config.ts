// @ts-check

import { NextConfig } from 'next';
import './src/server/env';

/**
 * @see https://nextjs.org/docs/api-reference/next.config.js/introduction
 */
export default {
  /** We run eslint as a separate task in CI */
  eslint: { ignoreDuringBuilds: !!process.env.CI },
  /** We run typechecking as a separate task in CI */
  typescript: {
    ignoreBuildErrors: !!process.env.CI,
  },
} satisfies NextConfig;
