import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
          }
        }
      },
      orderBy: { paymentDate: 'desc' },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('[SALARY_PAYMENTS_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { employeeId, amount, month, year, paymentDate, paymentMethod, reference, notes } = body;

    if (!employeeId || !amount || !month || !year || !paymentDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const payment = await prisma.salaryPayment.create({
      data: {
        employeeId,
        amount: parseFloat(amount),
        month: parseInt(month),
        year: parseInt(year),
        paymentDate: new Date(paymentDate),
        paymentMethod: paymentMethod || 'CASH',
        reference,
        notes,
      },
      include: {
        employee: {
          select: {
            name: true,
            jobRole: true,
          }
        }
      }
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('[SALARY_PAYMENTS_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await prisma.salaryPayment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SALARY_PAYMENTS_DELETE]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
