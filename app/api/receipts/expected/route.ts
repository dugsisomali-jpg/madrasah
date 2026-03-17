import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, shouldFilterMemorizationByTeacher, hasPermission } from '@/lib/auth-utils';

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

export async function GET(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;
  const canRead = session?.user?.id ? await hasPermission(session.user.id, 'payments.read') || await hasPermission(session.user.id, 'payments.manage') : false;
  if (!canRead) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId')?.trim();
  const monthsCount = searchParams.get('monthsCount');
  
  // Backward compatibility
  const fromMonth = searchParams.get('fromMonth');
  const fromYear = searchParams.get('fromYear');
  const toMonth = searchParams.get('toMonth');
  const toYear = searchParams.get('toYear');

  if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });

  const filterByTeacher = session?.user?.id ? await shouldFilterMemorizationByTeacher(session.user.id) : false;
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { fee: true, teacherId: true },
  });
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  if (student.fee == null) return NextResponse.json({ error: 'Student has no fee set' }, { status: 400 });
  if (filterByTeacher && student.teacherId !== session!.user!.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const feePerMonth = toNum(student.fee);
  let requiredAmount = 0;
  let unpaidCount = 0;
  let finalRange = { fromM: 0, fromY: 0, toM: 0, toY: 0 };

  if (monthsCount) {
    const count = parseInt(monthsCount, 10);
    if (isNaN(count) || count < 1) return NextResponse.json({ error: 'Invalid monthsCount' }, { status: 400 });

    const now = new Date();
    let currentM = now.getMonth() + 1;
    let currentY = now.getFullYear();
    
    // We look for the first month with a balance starting from current or previous (if previous has balance)
    // Actually, let's look for the VERY first unpaid month in the system for this student
    const firstEverUnpaid = await prisma.payment.findFirst({
        where: { studentId },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    if (firstEverUnpaid) {
        // If there are payments, check if the first one has balance
        const balance = toNum(firstEverUnpaid.totalDue) - toNum((firstEverUnpaid as any).discount) - toNum(firstEverUnpaid.amountPaid);
        if (balance <= 0) {
            // Find the first one with balance
            // This is slightly complex. Let's simplify: start from current month and go backwards until we find paid, then go forwards.
            // Or just use the logic: Start from current month, if previous has balance, start from there.
        }
    }

    // Simplified Smart Logic:
    // 1. Find the earliest month that has a balance > 0 (including carry over from before it)
    // 2. Or if none, the current month.
    
    let testM = currentM;
    let testY = currentY;
    
    // Look back up to 12 months for any unpaid balance
    for (let i = 0; i < 12; i++) {
        const pm = testM === 1 ? 12 : testM - 1;
        const py = testM === 1 ? testY - 1 : testY;
        const prev = await prisma.payment.findUnique({
            where: { studentId_month_year: { studentId, month: pm, year: py } }
        });
        if (prev) {
            const bal = toNum(prev.totalDue) - toNum((prev as any).discount) - toNum(prev.amountPaid);
            if (bal > 1) {
                testM = pm;
                testY = py;
            } else {
                break; // Found a fully paid month, stop looking back
            }
        } else {
            // No payment record. Might be unpaid or just never created.
            // For safety, let's stop looking back if we find no record beyond 3 months
            if (i > 3) break;
            testM = pm;
            testY = py;
        }
    }

    let foundCount = 0;
    let m = testM;
    let y = testY;
    
    while (foundCount < count) {
        const payment = await prisma.payment.findUnique({
            where: { studentId_month_year: { studentId, month: m, year: y } }
        });
        
        const balance = payment 
            ? toNum(payment.totalDue) - toNum((payment as any).discount) - toNum(payment.amountPaid)
            : feePerMonth; // Use full fee if no record

        if (balance > 1) {
            if (foundCount === 0) {
                finalRange.fromM = m;
                finalRange.fromY = y;
            }
            requiredAmount += balance;
            foundCount++;
            finalRange.toM = m;
            finalRange.toY = y;
        }
        
        m++;
        if (m > 12) { m = 1; y++; }
        
        // Safety break to avoid infinite loops
        if (y > currentY + 10) break;
    }
    unpaidCount = foundCount;

  } else if (fromMonth && fromYear && toMonth && toYear) {
    const fromM = parseInt(fromMonth, 10);
    const fromY = parseInt(fromYear, 10);
    const toM = parseInt(toMonth, 10);
    const toY = parseInt(toYear, 10);
    const months = [...monthRange(fromM, fromY, toM, toY)];
    finalRange = { fromM, fromY, toM, toY };

    let carry = 0;
    const firstMonth = months[0];
    const prevOfFirstMonth = firstMonth.month === 1 ? 12 : firstMonth.month - 1;
    const prevOfFirstYear = firstMonth.month === 1 ? firstMonth.year - 1 : firstMonth.year;
    const prevPayment = await prisma.payment.findUnique({
      where: { studentId_month_year: { studentId, month: prevOfFirstMonth, year: prevOfFirstYear } },
    });
    if (prevPayment) {
      const prevBalance = toNum(prevPayment.totalDue) - toNum((prevPayment as { discount?: unknown }).discount) - toNum(prevPayment.amountPaid);
      if (prevBalance > 0) carry = prevBalance;
    }

    for (const { month, year } of months) {
      const payment = await prisma.payment.findUnique({
        where: { studentId_month_year: { studentId, month, year } },
      });
      if (!payment) {
        requiredAmount += (feePerMonth + carry);
        unpaidCount++;
        carry = 0;
      } else {
        const balance = toNum(payment.totalDue) - toNum((payment as { discount?: unknown }).discount) - toNum(payment.amountPaid);
        if (balance > 0) {
          requiredAmount += balance;
          unpaidCount++;
        }
        carry = 0;
      }
    }
  }

  return NextResponse.json({ 
    requiredAmount: Math.round(requiredAmount * 100) / 100, 
    unpaidMonths: unpaidCount,
    range: finalRange 
  });
}
