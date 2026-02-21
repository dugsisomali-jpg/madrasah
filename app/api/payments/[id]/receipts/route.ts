import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, shouldFilterMemorizationByTeacher, hasPermission } from '@/lib/auth-utils';
import { Decimal } from '@prisma/client/runtime/library';

const createSchema = z.object({
  amount: z.number().positive(),
  receiptNumber: z.string().optional(),
  date: z.string().refine((s) => !isNaN(new Date(s).getTime()), { message: 'Invalid date' }),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;
  const canManage = session?.user?.id ? await hasPermission(session.user.id, 'payments.manage') : false;
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { id: paymentId } = await params;
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { Student: { select: { teacherId: true } } },
    });
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    const filterByTeacher = session?.user?.id ? await shouldFilterMemorizationByTeacher(session.user.id) : false;
    if (filterByTeacher && (payment.Student as { teacherId?: string }).teacherId !== session!.user!.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const nextM = payment.month === 12 ? 1 : payment.month + 1;
    const nextY = payment.month === 12 ? payment.year + 1 : payment.year;
    const nextPayment = await prisma.payment.findUnique({
      where: { studentId_month_year: { studentId: payment.studentId, month: nextM, year: nextY } },
      select: { balanceCarriedOver: true },
    });
    if (nextPayment && new Decimal(nextPayment.balanceCarriedOver).gt(0)) {
      return NextResponse.json({
        error: 'This payment\'s balance was carried over to the next month. Add receipts to the next month\'s payment instead.',
      }, { status: 400 });
    }

    const raw = createSchema.parse(await req.json());
    const amount = new Decimal(raw.amount);
    const newAmountPaid = new Decimal(payment.amountPaid).plus(amount);
    const totalDue = new Decimal(payment.totalDue);
    if (newAmountPaid.gt(totalDue)) {
      return NextResponse.json({ error: 'Receipt amount exceeds total due' }, { status: 400 });
    }

    const [receipt] = await prisma.$transaction([
      prisma.receipt.create({
        data: {
          paymentId,
          amount,
          receiptNumber: raw.receiptNumber || undefined,
          date: new Date(raw.date),
          notes: raw.notes || undefined,
        },
      }),
      prisma.payment.update({
        where: { id: paymentId },
        data: { amountPaid: newAmountPaid },
      }),
    ]);

    const updated = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { Student: { select: { id: true, name: true, fee: true } }, receipts: { orderBy: { date: 'desc' } } },
    });
    return NextResponse.json({ receipt, payment: updated }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: 'Failed to add receipt' }, { status: 500 });
  }
}
