import { prisma } from '@/server/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.setHeader('Allow', ['POST']).status(405).json({
      error: `Method ${req.method} Not Allowed`,
    });
  }

  try {
    const { email, name } = signupSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
