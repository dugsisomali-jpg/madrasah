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
  const fromMonth = searchParams.get('fromMonth');
  const fromYear = searchParams.get('fromYear');
  const toMonth = searchParams.get('toMonth');
  const toYear = searchParams.get('toYear');

  if (!studentId || !fromMonth || !fromYear || !toMonth || !toYear) {
    return NextResponse.json({ error: 'Missing params: studentId, fromMonth, fromYear, toMonth, toYear' }, { status: 400 });
  }

  const fromM = parseInt(fromMonth, 10);
  const fromY = parseInt(fromYear, 10);
  const toM = parseInt(toMonth, 10);
  const toY = parseInt(toYear, 10);

  const filterByTeacher = session?.user?.id ? await shouldFilterMemorizationByTeacher(session.user.id) : false;
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { fee: true, teacherId: true },
  });
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  if (student.fee == null || student.fee === undefined) return NextResponse.json({ error: 'Student has no fee set' }, { status: 400 });
  if (filterByTeacher && student.teacherId !== session!.user!.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const months = [...monthRange(fromM, fromY, toM, toY)];
  if (months.length === 0) return NextResponse.json({ requiredAmount: 0, unpaidMonths: 0 }, { status: 200 });

  const feePerMonth = toNum(student.fee);
  let requiredAmount = 0;
  let unpaidCount = 0;
  // Carry from before the range (month before first in range)
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
      const totalDue = feePerMonth + carry;
      requiredAmount += totalDue;
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

  return NextResponse.json({ requiredAmount: Math.round(requiredAmount * 100) / 100, unpaidMonths: unpaidCount });
}
