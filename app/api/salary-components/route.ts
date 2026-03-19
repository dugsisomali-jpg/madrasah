import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-utils';

const componentSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['EARNING', 'DEDUCTION']),
  description: z.string().optional(),
  isReusable: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const components = await prisma.salaryComponent.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(components);
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const canManage = await hasPermission(session.user.id, 'hr.manage');
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const data = componentSchema.parse(await req.json());
    const component = await prisma.salaryComponent.create({ data });
    return NextResponse.json(component, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
