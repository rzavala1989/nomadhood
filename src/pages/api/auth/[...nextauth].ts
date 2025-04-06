// ✅ Proper export for pages router:
import NextAuth from 'next-auth';
import { authOptions } from '@/utils/auth';
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return NextAuth(req, res, authOptions);
}
