import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';

const createSchema = z.object({
  name: z.string().min(1),
  resource: z.string().min(1),
  action: z.string().min(1),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;
  try {
    const data = createSchema.parse(await req.json());
    const permission = await prisma.permission.create({ data });
    return NextResponse.json(permission, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create permission' }, { status: 500 });
  }
}

export async function GET() {
  const { error: authError } = await requireAuth();
  if (authError) return authError;
  const permissions = await prisma.permission.findMany({
    orderBy: [{ resource: 'asc' }, { action: 'asc' }],
  });
  return NextResponse.json(permissions);
}
