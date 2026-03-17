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
  const canRead = session?.user?.id 
    ? await hasPermission(session.user.id, 'payments.read') || await hasPermission(session.user.id, 'payments.manage') 
    : false;
  if (!canRead) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get('parentId')?.trim();
  const monthsCount = searchParams.get('monthsCount');

  // Backward compatibility
  const fromMonth = searchParams.get('fromMonth');
  const fromYear = searchParams.get('fromYear');
  const toMonth = searchParams.get('toMonth');
  const toYear = searchParams.get('toYear');

  if (!parentId) return NextResponse.json({ error: 'Missing parentId' }, { status: 400 });

  const filterByTeacher = session?.user?.id ? await shouldFilterMemorizationByTeacher(session.user.id) : false;

  try {
    const students = await prisma.student.findMany({
      where: {
        parentId,
        ...(filterByTeacher && session?.user?.id ? { teacherId: session.user.id } : {}),
        fee: { not: null },
      },
      select: { id: true, name: true, fee: true },
    });

    if (students.length === 0) {
      return NextResponse.json({ requiredAmount: 0, unpaidMonths: 0, studentCount: 0, range: null });
    }

    let totalRequiredAmount = 0;
    let totalUnpaidMonths = 0;
    let minFromYear = 9999, minFromMonth = 13;
    let maxToYear = 0, maxToMonth = 0;

    for (const student of students) {
      const studentId = student.id;
      const feePerMonth = toNum(student.fee);
      let studentRequiredAmount = 0;
      let studentRange = { fromM: 0, fromY: 0, toM: 0, toY: 0 };

      if (monthsCount) {
        const count = parseInt(monthsCount, 10);
        const now = new Date();
        let currentM = now.getMonth() + 1;
        let currentY = now.getFullYear();
        
        let testM = currentM;
        let testY = currentY;
        
        // Look back for any unpaid balance
        for (let i = 0; i < 6; i++) {
          const pm = testM === 1 ? 12 : testM - 1;
          const py = testM === 1 ? testY - 1 : testY;
          const prev = await prisma.payment.findUnique({
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

        let foundCount = 0;
        let m = testM, y = testY;
        while (foundCount < count) {
          const payment = await prisma.payment.findUnique({
            where: { studentId_month_year: { studentId, month: m, year: y } }
          });
          const balance = payment ? toNum(payment.totalDue) - toNum((payment as any).discount) - toNum(payment.amountPaid) : feePerMonth;
          if (balance > 1) {
            if (foundCount === 0) { studentRange.fromM = m; studentRange.fromY = y; }
            studentRequiredAmount += balance;
            foundCount++;
            studentRange.toM = m; studentRange.toY = y;
          }
          m++; if (m > 12) { m = 1; y++; }
          if (y > currentY + 5) break;
        }
        totalUnpaidMonths += foundCount;

      } else if (fromMonth && fromYear && toMonth && toYear) {
        const fromM = parseInt(fromMonth, 10);
        const fromY = parseInt(fromYear, 10);
        const toM = parseInt(toMonth, 10);
        const toY = parseInt(toYear, 10);
        const months = [...monthRange(fromM, fromY, toM, toY)];
        studentRange = { fromM, fromY, toM, toY };

        let carry = 0;
        const firstM = months[0];
        const prevM = firstM.month === 1 ? 12 : firstM.month - 1;
        const prevY = firstM.month === 1 ? firstM.year - 1 : firstM.year;
        const prevPayment = await prisma.payment.findUnique({
          where: { studentId_month_year: { studentId, month: prevM, year: prevY } },
        });
        if (prevPayment) {
          const prevBalance = toNum(prevPayment.totalDue) - toNum((prevPayment as any).discount) - toNum(prevPayment.amountPaid);
          if (prevBalance > 1) carry = prevBalance;
        }

        for (const { month, year } of months) {
          const payment = await prisma.payment.findUnique({
            where: { studentId_month_year: { studentId, month, year } },
          });
          if (!payment) {
            studentRequiredAmount += (feePerMonth + carry);
            totalUnpaidMonths++;
            carry = 0;
          } else {
            const balance = toNum(payment.totalDue) - toNum((payment as any).discount) - toNum(payment.amountPaid);
            if (balance > 1) {
              studentRequiredAmount += balance;
              totalUnpaidMonths++;
            }
            carry = 0;
          }
        }
      }

      totalRequiredAmount += studentRequiredAmount;
      
      // Update overall parent range
      if (studentRange.fromY > 0) {
          if (studentRange.fromY < minFromYear || (studentRange.fromY === minFromYear && studentRange.fromM < minFromMonth)) {
              minFromYear = studentRange.fromY; minFromMonth = studentRange.fromM;
          }
          if (studentRange.toY > maxToYear || (studentRange.toY === maxToYear && studentRange.toM > maxToMonth)) {
              maxToYear = studentRange.toY; maxToMonth = studentRange.toM;
          }
      }
    }

    return NextResponse.json({
      requiredAmount: Math.round(totalRequiredAmount * 100) / 100,
      unpaidMonths: totalUnpaidMonths,
      studentCount: students.length,
      range: maxToYear > 0 ? { fromM: minFromMonth, fromY: minFromYear, toM: maxToMonth, toY: maxToYear } : null
    });
  } catch (err) {
    console.error('Expected by parent error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
