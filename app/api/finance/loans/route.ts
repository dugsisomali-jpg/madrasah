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
    const loans = await prisma.loan.findMany({
      where: employeeId ? { employeeId } : {},
      include: {
        employee: { select: { name: true, jobRole: true } },
        repayments: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(loans);
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
    const { employeeId, amount, interestRate, tenorMonths, startDate, notes } = body;

    const monthlyInstallment = (parseFloat(amount) * (1 + parseFloat(interestRate || 0) / 100)) / parseInt(tenorMonths);

    const loan = await prisma.loan.create({
      data: {
        employeeId,
        amount: parseFloat(amount),
        interestRate: parseFloat(interestRate || 0),
        tenorMonths: parseInt(tenorMonths),
        monthlyInstallment: monthlyInstallment,
        remainingBalance: parseFloat(amount), // simplified
        startDate: new Date(startDate),
        notes
      }
    });
    return NextResponse.json(loan);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
