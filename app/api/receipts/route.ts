import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, shouldFilterMemorizationByTeacher, hasPermission } from '@/lib/auth-utils';
import { Decimal } from '@prisma/client/runtime/library';

const payForwardSchema = z.object({
  studentId: z.string(),
  fromMonth: z.number().int().min(1).max(12).optional(),
  fromYear: z.number().int().min(2020).max(2100).optional(),
  toMonth: z.number().int().min(1).max(12).optional(),
  toYear: z.number().int().min(2020).max(2100).optional(),
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

  let body: any;
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

    const monthsCount = body.monthsCount;
    let months: { month: number, year: number }[] = [];
    
    const now = new Date();
    const currentM = now.getMonth() + 1;
    const currentY = now.getFullYear();

    if (monthsCount) {
        const count = parseInt(monthsCount, 10);
        if (isNaN(count) || count < 1) return NextResponse.json({ error: 'Invalid monthsCount' }, { status: 400 });
        
        const latestPaid = await prisma.payment.findFirst({
            where: { studentId: raw.studentId, amountPaid: { gt: 0 } },
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
        });

        let startM = currentM;
        let startY = currentY;

        if (latestPaid) {
            const balance = toNum(latestPaid.totalDue) - toNum((latestPaid as any).discount) - toNum(latestPaid.amountPaid);
            if (balance <= 1) {
                startM = latestPaid.month + 1;
                startY = latestPaid.year;
                if (startM > 12) { startM = 1; startY++; }
            } else {
                let testM = latestPaid.month;
                let testY = latestPaid.year;
                for (let i = 0; i < 12; i++) {
                    const pm = testM === 1 ? 12 : testM - 1;
                    const py = testM === 1 ? testY - 1 : testY;
                    if (py < currentY || (py === currentY && pm < currentM)) break;

                    const prev = await prisma.payment.findUnique({
                        where: { studentId_month_year: { studentId: raw.studentId, month: pm, year: py } }
                    });
                    if (prev) {
                        const bal = toNum(prev.totalDue) - toNum((prev as any).discount) - toNum(prev.amountPaid);
                        if (bal > 1) { testM = pm; testY = py; } else { break; }
                    } else {
                        if (i > 3) break;
                        testM = pm; testY = py;
                    }
                }
                startM = testM;
                startY = testY;
            }
        }

        if (startY < currentY || (startY === currentY && startM < currentM)) {
            startM = currentM;
            startY = currentY;
        }

        let foundCount = 0;
        let m = startM, y = startY;
        while (foundCount < count) {
            const payment = await prisma.payment.findUnique({
                where: { studentId_month_year: { studentId: raw.studentId, month: m, year: y } }
            });
            const balance = payment ? toNum(payment.totalDue) - toNum((payment as any).discount) - toNum(payment.amountPaid) : toNum(student.fee);
            if (balance > 1) {
                months.push({ month: m, year: y });
                foundCount++;
            }
            m++; if (m > 12) { m = 1; y++; }
            if (y > currentY + 5) break;
        }
    } else {
        months = [...monthRange(raw.fromMonth!, raw.fromYear!, raw.toMonth!, raw.toYear!)];
    }

    if (months.length === 0) return NextResponse.json({ error: 'Invalid month range' }, { status: 400 });

    const feePerMonth = toNum(student.fee);
    const allPayments: any[] = [];
    let carry = 0;
    
    if (!monthsCount) {
        const firstMonth = months[0];
        const prevOfFirstMonth = firstMonth.month === 1 ? 12 : firstMonth.month - 1;
        const prevOfFirstYear = firstMonth.month === 1 ? firstMonth.year - 1 : firstMonth.year;
        const prevPayment = await prisma.payment.findUnique({
          where: { studentId_month_year: { studentId: raw.studentId, month: prevOfFirstMonth, year: prevOfFirstYear } },
        });
        if (prevPayment) {
          const prevBalance = toNum(prevPayment.totalDue) - toNum((prevPayment as any).discount) - toNum(prevPayment.amountPaid);
          if (prevBalance > 0) carry = prevBalance;
        }
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
        discount: toNum((payment as any).discount),
        amountPaid: toNum(payment.amountPaid),
        balanceDueDate: (payment as any).balanceDueDate ?? null,
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
    receiptDate.setHours(0, 0, 0, 0);
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

      let createdCount = 0;
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
        const dueDate = p.balanceDueDate ? new Date(p.balanceDueDate) : null;
        if (dueDate) dueDate.setHours(0, 0, 0, 0);
        const resetDueDate = dueDate && receiptDate >= dueDate;
        await tx.payment.update({
          where: { id: p.id },
          data: {
            amountPaid: new Decimal(newAmountPaid),
            ...(resetDueDate ? { balanceDueDate: null } : {}),
          },
        });
        createdCount++;
      }
      return { created: createdCount, skipped: months.length - payments.length };
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
