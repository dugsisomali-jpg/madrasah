import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, shouldFilterMemorizationByTeacher, hasPermission } from '@/lib/auth-utils';
import { Decimal } from '@prisma/client/runtime/library';

const schema = z.object({
  parentId: z.string(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  totalAmount: z.coerce.number().positive(),
  discount: z.coerce.number().min(0).optional().default(0),
  receiptNumber: z.string().optional(),
  date: z.string().refine((s) => !isNaN(new Date(s).getTime()), { message: 'Invalid date' }),
  notes: z.string().optional(),
});

function toNum(v: unknown): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v) || 0;
}

export async function POST(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;
  const canManage = session?.user?.id ? await hasPermission(session.user.id, 'payments.manage') : false;
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const raw = schema.parse(await req.json());
    const filterByTeacher = session?.user?.id ? await shouldFilterMemorizationByTeacher(session.user.id) : false;

    const students = await prisma.student.findMany({
      where: {
        parentId: raw.parentId,
        ...(filterByTeacher && session?.user?.id ? { teacherId: session.user.id } : {}),
        fee: { not: null },
      },
      select: { id: true, name: true, fee: true },
    });

    if (students.length === 0) {
      return NextResponse.json({ error: 'No students found for this parent' }, { status: 400 });
    }

    const studentIds = students.map((s) => s.id);
    const feeMap = new Map(students.map((s) => [s.id, toNum(s.fee)]));

    const existingPayments = await prisma.payment.findMany({
      where: {
        studentId: { in: studentIds },
        month: raw.month,
        year: raw.year,
      },
      include: { Student: { select: { teacherId: true } } },
    });

    const balanceWithDiscount = (p: { totalDue: unknown; discount?: unknown; amountPaid: unknown }) =>
      toNum(p.totalDue) - toNum((p as { discount?: unknown }).discount) - toNum(p.amountPaid);
    const nextMonthKeys = existingPayments
      .filter((p) => balanceWithDiscount(p) > 0)
      .map((p) => {
        const nextM = p.month === 12 ? 1 : p.month + 1;
        const nextY = p.month === 12 ? p.year + 1 : p.year;
        return { studentId: p.studentId, month: nextM, year: nextY };
      });
    const nextMonthPayments = nextMonthKeys.length
      ? await prisma.payment.findMany({
          where: { OR: nextMonthKeys.map((k) => ({ studentId: k.studentId, month: k.month, year: k.year })) },
          select: { studentId: true, month: true, year: true, balanceCarriedOver: true },
        })
      : [];
    const carriedOverKeys = new Set(
      nextMonthPayments
        .filter((np) => new Decimal(np.balanceCarriedOver).gt(0))
        .map((np) => {
          const prevM = np.month === 1 ? 12 : np.month - 1;
          const prevY = np.month === 1 ? np.year - 1 : np.year;
          return `${np.studentId}:${prevM}:${prevY}`;
        })
    );

    const allPayments: { id: string; studentId: string; totalDue: number; discount: number; amountPaid: number }[] = [];
    const studentsWithPayment = new Set(existingPayments.map((p) => p.studentId));
    let carry = 0;
    const prevMonth = raw.month === 1 ? 12 : raw.month - 1;
    const prevYear = raw.month === 1 ? raw.year - 1 : raw.year;

    for (const s of students) {
      let payment = existingPayments.find((p) => p.studentId === s.id);
      if (!payment) {
        const prevPayment = await prisma.payment.findUnique({
          where: { studentId_month_year: { studentId: s.id, month: prevMonth, year: prevYear } },
        });
        if (prevPayment) {
          const prevBalance = toNum(prevPayment.totalDue) - toNum((prevPayment as { discount?: unknown }).discount) - toNum(prevPayment.amountPaid);
          if (prevBalance > 0) carry = prevBalance;
        }
        const feeAmount = feeMap.get(s.id) ?? 0;
        const totalDue = feeAmount + carry;
        payment = await prisma.payment.create({
          data: {
            studentId: s.id,
            month: raw.month,
            year: raw.year,
            feeAmount: new Decimal(feeAmount),
            balanceCarriedOver: new Decimal(carry),
            totalDue: new Decimal(totalDue),
            amountPaid: 0,
          },
          include: { Student: { select: { teacherId: true } } },
        });
        carry = 0;
      }
      allPayments.push({
        id: payment.id,
        studentId: payment.studentId,
        totalDue: toNum(payment.totalDue),
        discount: toNum((payment as { discount?: unknown }).discount),
        amountPaid: toNum(payment.amountPaid),
      });
    }

    const payments = allPayments.filter((p) => {
      const balance = p.totalDue - p.discount - p.amountPaid;
      if (balance <= 0) return false;
      const key = `${p.studentId}:${raw.month}:${raw.year}`;
      return !carriedOverKeys.has(key);
    });

    if (payments.length === 0) {
      return NextResponse.json({ error: 'All children are already fully paid for this month' }, { status: 400 });
    }

    const expectedTotal = payments.reduce((sum, p) => sum + (p.totalDue - p.discount - p.amountPaid), 0);
    const discount = raw.discount ?? 0;
    const amountAfterDiscount = Math.max(0, expectedTotal - discount);
    if (raw.totalAmount > amountAfterDiscount + 0.01) {
      return NextResponse.json({
        error: `Amount cannot exceed ${amountAfterDiscount.toLocaleString()} KES (total ${expectedTotal.toLocaleString()} minus discount ${discount.toLocaleString()})`,
      }, { status: 400 });
    }

    const receiptDate = new Date(raw.date);
    const receiptNumber = raw.receiptNumber || undefined;
    const notes = discount > 0
      ? [raw.notes, `Discount: ${discount.toLocaleString()} KES waived`].filter(Boolean).join('. ')
      : raw.notes || undefined;

    const paymentsWithBalance = payments.map((p) => {
      const balance = p.totalDue - p.discount - p.amountPaid;
      return { ...p, balance };
    });
    const totalBalance = paymentsWithBalance.reduce((sum, p) => sum + p.balance, 0);

    const paidInFull = raw.totalAmount >= amountAfterDiscount - 0.01;
    const cashToApply = raw.totalAmount;
    const discountToApply = paidInFull ? discount : 0;

    const amountsToApply: { paymentId: string; amount: number }[] = [];
    const discountsToApply: { paymentId: string; discount: number }[] = [];
    if (totalBalance <= 0) {
    } else if (paidInFull && discountToApply > 0) {
      let cashAlloc = 0;
      let discountAlloc = 0;
      for (let i = 0; i < paymentsWithBalance.length; i++) {
        const p = paymentsWithBalance[i];
        const isLast = i === paymentsWithBalance.length - 1;
        const ratio = p.balance / totalBalance;
        const cash = isLast ? Math.round((cashToApply - cashAlloc) * 100) / 100 : Math.round(cashToApply * ratio * 100) / 100;
        const disc = isLast ? Math.round((discountToApply - discountAlloc) * 100) / 100 : Math.round(discountToApply * ratio * 100) / 100;
        const cashCapped = Math.min(Math.max(0, cash), p.balance, cashToApply - cashAlloc);
        const discCapped = Math.min(Math.max(0, disc), p.balance - cashCapped, discountToApply - discountAlloc);
        amountsToApply.push({ paymentId: p.id, amount: cashCapped });
        discountsToApply.push({ paymentId: p.id, discount: discCapped });
        cashAlloc += cashCapped;
        discountAlloc += discCapped;
      }
    } else if (cashToApply >= totalBalance - 0.01) {
      paymentsWithBalance.forEach((p) => amountsToApply.push({ paymentId: p.id, amount: p.balance }));
    } else {
      let allocated = 0;
      for (let i = 0; i < paymentsWithBalance.length; i++) {
        const p = paymentsWithBalance[i];
        const isLast = i === paymentsWithBalance.length - 1;
        const amount = isLast
          ? Math.round((cashToApply - allocated) * 100) / 100
          : Math.round((cashToApply * (p.balance / totalBalance)) * 100) / 100;
        const capped = Math.min(Math.max(0, amount), p.balance, cashToApply - allocated);
        amountsToApply.push({ paymentId: p.id, amount: capped });
        allocated += capped;
      }
    }

    const receiptData = amountsToApply
      .filter((a) => a.amount > 0)
      .map(({ paymentId, amount }) => ({
        paymentId,
        amount: new Decimal(amount),
        receiptNumber: receiptNumber || undefined,
        date: receiptDate,
        notes: notes || undefined,
      }));
    await prisma.receipt.createMany({ data: receiptData });

    await Promise.all(
      amountsToApply
        .filter((a) => a.amount > 0)
        .map(async ({ paymentId, amount }) => {
          const p = payments.find((x) => x.id === paymentId)!;
          const newAmountPaid = p.amountPaid + amount;
          const discRow = discountsToApply.find((d) => d.paymentId === paymentId);
          const newDiscount = p.discount + (discRow?.discount ?? 0);
          return prisma.payment.update({
            where: { id: paymentId },
            data: {
              amountPaid: new Decimal(newAmountPaid),
              ...(newDiscount > 0 ? { discount: new Decimal(newDiscount) } : {}),
            },
          });
        }),
    );

    const receiptsCreated = amountsToApply.filter((a) => a.amount > 0).length;
    return NextResponse.json({
      created: receiptsCreated,
      totalAmount: raw.totalAmount,
      month: raw.month,
      year: raw.year,
    }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 400 });
    const message = err instanceof Error ? err.message : 'Failed to add receipt';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
