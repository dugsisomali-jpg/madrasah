import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const canRead = await hasPermission(session.user.id, 'hr.read') || await hasPermission(session.user.id, 'hr.manage');
  if (!canRead) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get('employeeId');

  try {
    const advances = await prisma.salaryAdvance.findMany({
      where: employeeId ? { employeeId } : {},
      include: {
        employee: { select: { name: true, jobRole: true } }
      },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(advances);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const canManage = await hasPermission(session.user.id, 'hr.manage');
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const { employeeId, amount, date, notes, status, deductionMonth, deductionYear } = body;

    const advance = await prisma.salaryAdvance.create({
      data: {
        employeeId,
        amount: parseFloat(amount),
        date: new Date(date),
        notes,
        status: status || 'PENDING',
        deductionMonth: deductionMonth ? parseInt(deductionMonth) : null,
        deductionYear: deductionYear ? parseInt(deductionYear) : null,
      }
    });
    return NextResponse.json(advance);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
