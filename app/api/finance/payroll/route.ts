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
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  try {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

    const payments = await prisma.salaryPayment.findMany({
      where,
      include: {
        employee: {
          select: {
            name: true,
            jobRole: true,
            basicSalary: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('[PAYROLL_GET]', error);
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
    const { 
      employeeId, 
      amount, 
      loanDeduction, 
      advanceDeduction, 
      netSalary, 
      month, 
      year, 
      paymentDate, 
      paymentMethod, 
      reference, 
      notes 
    } = body;

    if (!employeeId || !amount || !month || !year || !paymentDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const payment = await prisma.salaryPayment.create({
      data: {
        employeeId,
        amount: parseFloat(amount),
        loanDeduction: parseFloat(loanDeduction || 0),
        advanceDeduction: parseFloat(advanceDeduction || 0),
        netSalary: parseFloat(netSalary || amount),
        month: parseInt(month),
        year: parseInt(year),
        paymentDate: new Date(paymentDate),
        paymentMethod: paymentMethod || 'CASH',
        reference,
        notes,
      },
    });

    // If there were deductions, we might want to update loan balance or advance status
    // For now, keep it simple. Logic for auto-updating balances can be added here or in a separate transaction.

    return NextResponse.json(payment);
  } catch (error) {
    console.error('[PAYROLL_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const canManage = await hasPermission(session.user.id, 'hr.manage');
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await prisma.salaryPayment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PAYROLL_DELETE]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
