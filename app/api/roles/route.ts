import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;
  try {
    const data = createSchema.parse(await req.json());
    const role = await prisma.role.create({ data });
    return NextResponse.json(role, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}

export async function GET() {
  const { error: authError } = await requireAuth();
  if (authError) return authError;
  const roles = await prisma.role.findMany({
    orderBy: { name: 'asc' },
    include: { permissions: true },
  });
  return NextResponse.json(roles);
}
