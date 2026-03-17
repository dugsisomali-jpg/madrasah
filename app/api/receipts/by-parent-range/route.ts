import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, shouldFilterMemorizationByTeacher, hasPermission } from '@/lib/auth-utils';
import { Decimal } from '@prisma/client/runtime/library';

const schema = z.object({
  parentId: z.string(),
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
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const raw = schema.parse(body);
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

    const monthsCount = body.monthsCount;
    const receiptDate = new Date(raw.date);
    receiptDate.setHours(0, 0, 0, 0);
    const receiptNumber = raw.receiptNumber || undefined;
    const notes = raw.notes || undefined;
    
    const now = new Date();
    const currentM = now.getMonth() + 1;
    const currentY = now.getFullYear();

    const results = await prisma.$transaction(async (tx) => {
      let totalCreatedReceipts = 0;
      let totalAllocated = 0;

      for (const student of students) {
        const studentId = student.id;
        const feePerMonth = toNum(student.fee);
        
        let studentMonths: { month: number, year: number }[] = [];
        if (monthsCount) {
            const count = parseInt(monthsCount, 10);
            
            const latestPaid = await tx.payment.findFirst({
                where: { studentId, amountPaid: { gt: 0 } },
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

                        const prev = await tx.payment.findUnique({
                            where: { studentId_month_year: { studentId, month: pm, year: py } }
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
                const payment = await tx.payment.findUnique({
                    where: { studentId_month_year: { studentId, month: m, year: y } }
                });
                const balance = payment ? toNum(payment.totalDue) - toNum((payment as any).discount) - toNum(payment.amountPaid) : feePerMonth;
                if (balance > 1) {
                    studentMonths.push({ month: m, year: y });
                    foundCount++;
                }
                m++; if (m > 12) { m = 1; y++; }
                if (y > currentY + 5) break;
            }
        } else {
            studentMonths = [...monthRange(raw.fromMonth!, raw.fromYear!, raw.toMonth!, raw.toYear!)];
        }

        if (studentMonths.length === 0) continue;

        let carry = 0;
        if (!monthsCount) {
            const firstMonth = studentMonths[0];
            const prevM = firstMonth.month === 1 ? 12 : firstMonth.month - 1;
            const prevY = firstMonth.month === 1 ? firstMonth.year - 1 : firstMonth.year;
            const prevPayment = await tx.payment.findUnique({
              where: { studentId_month_year: { studentId, month: prevM, year: prevY } },
            });
            if (prevPayment) {
              const prevBalance = toNum(prevPayment.totalDue) - toNum((prevPayment as any).discount) - toNum(prevPayment.amountPaid);
              if (prevBalance > 0.01) carry = prevBalance;
            }
        }

        const studentPaymentsToPay: any[] = [];
        for (const { month, year } of studentMonths) {
          let payment = await tx.payment.findUnique({
            where: { studentId_month_year: { studentId, month, year } },
          });
          
          if (!payment) {
            const balanceCarriedOver = new Decimal(carry);
            const feeAmount = new Decimal(feePerMonth);
            const totalDue = feeAmount.plus(balanceCarriedOver);
            payment = await tx.payment.create({
              data: {
                studentId,
                month,
                year,
                feeAmount,
                balanceCarriedOver,
                totalDue,
                amountPaid: 0,
              },
            });
            carry = 0;
          } else {
            carry = 0;
          }
          
          const balance = toNum(payment.totalDue) - toNum((payment as any).discount) - toNum(payment.amountPaid);
          if (balance > 0.1) {
            studentPaymentsToPay.push({ ...payment, balance });
          }
        }

        if (studentPaymentsToPay.length > 0) {
          const studentTotal = studentPaymentsToPay.reduce((sum, p) => sum + p.balance, 0);
          
          const receiptBatch = await tx.receiptBatch.create({
            data: {
              studentId,
              totalAmount: new Decimal(studentTotal),
              receiptNumber,
              date: receiptDate,
              notes,
              fromMonth: studentPaymentsToPay[0].month,
              fromYear: studentPaymentsToPay[0].year,
              toMonth: studentPaymentsToPay[studentPaymentsToPay.length - 1].month,
              toYear: studentPaymentsToPay[studentPaymentsToPay.length - 1].year,
            },
          });

          for (const p of studentPaymentsToPay) {
            const alloc = p.balance;
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

            const newAmountPaid = toNum(p.amountPaid) + alloc;
            const dueDate = (p as any).balanceDueDate ? new Date((p as any).balanceDueDate) : null;
            if (dueDate) dueDate.setHours(0, 0, 0, 0);
            const resetDueDate = dueDate && receiptDate >= dueDate;

            await tx.payment.update({
              where: { id: p.id },
              data: {
                amountPaid: new Decimal(newAmountPaid),
                ...(resetDueDate ? { balanceDueDate: null } : {}),
              },
            });
            totalCreatedReceipts++;
            totalAllocated += alloc;
          }
        }
      }
      return { totalCreatedReceipts, totalAllocated };
    }, {
      timeout: 30000, 
    });

    return NextResponse.json({
      created: results.totalCreatedReceipts,
      totalAmount: results.totalAllocated,
      studentCount: students.length,
    }, { status: 201 });

  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    console.error('[POST /api/receipts/by-parent-range] error:', err);
    return NextResponse.json({ error: 'Failed to process range payment' }, { status: 500 });
  }
}
