import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function toNum(v: any): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v) || 0;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const userId = searchParams.get('userId');

  try {
    const where: any = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (userId) where.userId = userId;

    const payrolls = await prisma.salaryPayment.findMany({
      where,
      include: { User: { select: { id: true, name: true, username: true } } },
      orderBy: { paymentDate: 'desc' },
    });

    return NextResponse.json(payrolls);
  } catch (error) {
    console.error('[PAYROLL_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { userId, amount, month, year, paymentDate, notes, isAdvance } = body;

    if (!userId || !amount || !month || !year || !paymentDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const payroll = await prisma.salaryPayment.create({
      data: {
        userId,
        amount: toNum(amount),
        month: parseInt(month),
        year: parseInt(year),
        paymentDate: new Date(paymentDate),
        isAdvance: !!isAdvance,
        notes,
      },
    });

    return NextResponse.json(payroll);
  } catch (error) {
    console.error('[PAYROLL_POST]', error);
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
    console.error('[PAYROLL_DELETE]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
