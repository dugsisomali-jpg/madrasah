import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-utils';

const runSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
});

export async function GET(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const runs = await prisma.payrollRun.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return NextResponse.json(runs);
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
    const { month, year } = runSchema.parse(await req.json());
    
    // Check if run already exists
    const existing = await prisma.payrollRun.findFirst({ where: { month, year } });
    if (existing) return NextResponse.json({ error: 'Payroll run for this period already exists' }, { status: 400 });

    // 1. Create the Payroll Run (DRAFT)
    const pRun = await prisma.payrollRun.create({
      data: { month, year, status: 'DRAFT' }
    });

    return NextResponse.json(pRun, { status: 201 });
  } catch (err) {
    console.error('POST /api/payroll-runs error:', err);
    return NextResponse.json({ error: 'Failed to initialize payroll run' }, { status: 500 });
  }
}
