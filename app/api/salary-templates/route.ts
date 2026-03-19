import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-utils';

const templateSchema = z.object({
  name: z.string().min(1),
  components: z.array(z.object({
    componentId: z.string(),
    amount: z.number().min(0),
  })),
});

export async function GET(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const templates = await prisma.salaryTemplate.findMany({
      include: {
        components: {
          include: { component: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(templates);
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
    const { name, components } = templateSchema.parse(await req.json());
    
    const template = await prisma.salaryTemplate.create({
      data: {
        name,
        components: {
          create: components.map(c => ({
            salaryComponentId: c.componentId,
            amount: c.amount,
          })),
        },
      },
      include: {
        components: { include: { component: true } },
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    console.error('POST /api/salary-templates error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
