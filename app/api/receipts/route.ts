import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, shouldFilterMemorizationByTeacher, hasPermission } from '@/lib/auth-utils';
import { Decimal } from '@prisma/client/runtime/library';

const payForwardSchema = z.object({
  studentId: z.string(),
  fromMonth: z.number().int().min(1).max(12),
  fromYear: z.number().int().min(2020).max(2100),
  toMonth: z.number().int().min(1).max(12),
  toYear: z.number().int().min(2020).max(2100),
  totalAmount: z.number().positive(),
  receiptNumber: z.string().optional(),
  date: z.string().refine((s) => !isNaN(new Date(s).getTime()), { message: 'Invalid date' }),
  notes: z.string().optional(),
});

function toNum(v: unknown): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v) || 0;
}

function* monthRange(fromM: number, fromY: number, toM: number, toY: number) {
  let m = fromM;
  let y = fromY;
  const end = toY * 12 + toM;
  while (y * 12 + m <= end) {
    yield { month: m, year: y };
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
}

export async function POST(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;
  const canManage = session?.user?.id ? await hasPermission(session.user.id, 'payments.manage') : false;
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body', payload: null }, { status: 400 });
  }

  try {
    const raw = payForwardSchema.parse(body);
    const filterByTeacher = session?.user?.id ? await shouldFilterMemorizationByTeacher(session.user.id) : false;

    const student = await prisma.student.findUnique({
      where: { id: raw.studentId },
      select: { fee: true, teacherId: true },
    });
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    if (student.fee == null || student.fee === undefined) return NextResponse.json({ error: 'Student has no fee set' }, { status: 400 });
    if (filterByTeacher && student.teacherId !== session!.user!.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const months = [...monthRange(raw.fromMonth, raw.fromYear, raw.toMonth, raw.toYear)];
    if (months.length === 0) return NextResponse.json({ error: 'Invalid month range' }, { status: 400 });

    const feePerMonth = toNum(student.fee);
    const allPayments: { id: string; month: number; year: number; totalDue: number; discount: number; amountPaid: number }[] = [];
    let carry = 0;
    const firstMonth = months[0];
    const prevOfFirstMonth = firstMonth.month === 1 ? 12 : firstMonth.month - 1;
    const prevOfFirstYear = firstMonth.month === 1 ? firstMonth.year - 1 : firstMonth.year;
    const prevPayment = await prisma.payment.findUnique({
      where: { studentId_month_year: { studentId: raw.studentId, month: prevOfFirstMonth, year: prevOfFirstYear } },
    });
    if (prevPayment) {
      const prevBalance = toNum(prevPayment.totalDue) - toNum((prevPayment as { discount?: unknown }).discount) - toNum(prevPayment.amountPaid);
      if (prevBalance > 0) carry = prevBalance;
    }

    for (const { month, year } of months) {
      let payment = await prisma.payment.findUnique({
        where: { studentId_month_year: { studentId: raw.studentId, month, year } },
        include: { Student: { select: { teacherId: true } } },
      });
      if (!payment) {
        const balanceCarriedOver = new Decimal(carry);
        const feeAmount = new Decimal(feePerMonth);
        const totalDue = feeAmount.plus(balanceCarriedOver);
        payment = await prisma.payment.create({
          data: {
            studentId: raw.studentId,
            month,
            year,
            feeAmount,
            balanceCarriedOver,
            totalDue,
            amountPaid: 0,
          },
          include: { Student: { select: { teacherId: true } } },
        });
        carry = 0;
      } else {
        carry = 0;
      }
      allPayments.push({
        id: payment.id,
        month: payment.month,
        year: payment.year,
        totalDue: toNum(payment.totalDue),
        discount: toNum((payment as { discount?: unknown }).discount),
        amountPaid: toNum(payment.amountPaid),
      });
    }

    const payments = allPayments.filter((p) => p.totalDue - p.discount - p.amountPaid > 0);
    if (payments.length === 0) {
      return NextResponse.json({ error: 'All months in range are already fully paid' }, { status: 400 });
    }

    const expectedTotal = payments.reduce((sum, p) => sum + (p.totalDue - p.discount - p.amountPaid), 0);
    if (Math.abs(raw.totalAmount - expectedTotal) > 0.01) {
      return NextResponse.json({
        error: `You must pay the full amount: ${expectedTotal.toLocaleString()} KES for ${payments.length} month(s)`,
      }, { status: 400 });
    }

    const receiptDate = new Date(raw.date);
    const receiptNumber = raw.receiptNumber || undefined;
    const notes = raw.notes || undefined;

    const firstUnpaid = payments[0];
    const lastUnpaid = payments[payments.length - 1];

    const { created, skipped } = await prisma.$transaction(async (tx) => {
      const receiptBatch = await tx.receiptBatch.create({
        data: {
          studentId: raw.studentId,
          totalAmount: new Decimal(raw.totalAmount),
          receiptNumber,
          date: receiptDate,
          notes,
          fromMonth: firstUnpaid.month,
          fromYear: firstUnpaid.year,
          toMonth: lastUnpaid.month,
          toYear: lastUnpaid.year,
        },
      });

      let created = 0;
      for (const p of payments) {
        const balance = p.totalDue - p.discount - p.amountPaid;
        const alloc = balance;
        if (alloc <= 0) continue;
        const newAmountPaid = p.amountPaid + alloc;
        await tx.receipt.create({
          data: {
            paymentId: p.id,
            receiptBatchId: receiptBatch.id,
            amount: new Decimal(alloc),
            receiptNumber,
            date: receiptDate,
            notes,
          },
        });
        await tx.payment.update({
          where: { id: p.id },
          data: { amountPaid: new Decimal(newAmountPaid) },
        });
        created++;
      }
      return { created, skipped: months.length - payments.length };
    });
    return NextResponse.json({ created, months: payments.length, skipped }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    const message = err instanceof Error ? err.message : 'Failed to add receipt';
    console.error('[POST /api/receipts] 500:', message, err);
    return NextResponse.json({
      error: 'Failed to add receipt',
      details: message,
      payload: body,
    }, { status: 500 });
  }
}
