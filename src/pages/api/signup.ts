import { prisma } from '@/server/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.setHeader('Allow', ['POST']).status(405).json({
      error: `Method ${req.method} Not Allowed`,
    });
  }

  const { email, name } = req.body;
  if (!email || !name) return res.status(400).json({ error: 'Missing fields' });

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(200).json({ message: 'Already signed up' });

    await prisma.user.create({
      data: {
        email,
        name,
      },
    });

    return res.status(200).json({ message: 'User created' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal error' });
  }
}
