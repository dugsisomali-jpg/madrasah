import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, shouldFilterMemorizationByTeacher, hasPermission } from '@/lib/auth-utils';
import { Decimal } from '@prisma/client/runtime/library';

function toNum(v: unknown): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v) || 0;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;
  const canRead = session?.user?.id ? await hasPermission(session.user.id, 'payments.read') || await hasPermission(session.user.id, 'payments.manage') : false;
  if (!canRead) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      Student: { select: { id: true, name: true, fee: true, teacherId: true } },
      receipts: { orderBy: { date: 'desc' } },
    },
  });
  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

  const filterByTeacher = session?.user?.id ? await shouldFilterMemorizationByTeacher(session.user.id) : false;
  const student = payment.Student as { teacherId?: string } | null;
  if (filterByTeacher && student?.teacherId !== session!.user!.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const balance = toNum(payment.totalDue) - toNum((payment as { discount?: unknown }).discount) - toNum(payment.amountPaid);
  const nextM = payment.month === 12 ? 1 : payment.month + 1;
  const nextY = payment.month === 12 ? payment.year + 1 : payment.year;
  const nextPayment = await prisma.payment.findUnique({
    where: { studentId_month_year: { studentId: payment.studentId, month: nextM, year: nextY } },
    select: { balanceCarriedOver: true },
  });
  const balanceWasCarried = nextPayment && new Decimal(nextPayment.balanceCarriedOver).gt(0);
  const canAddReceipt = balance > 0 && !balanceWasCarried;

  return NextResponse.json({ ...payment, canAddReceipt });
}
