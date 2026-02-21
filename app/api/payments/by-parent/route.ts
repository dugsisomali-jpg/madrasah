import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, shouldFilterMemorizationByTeacher, hasPermission } from '@/lib/auth-utils';
import { Decimal } from '@prisma/client/runtime/library';

function toNum(v: unknown): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v) || 0;
}

export async function GET(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;
  const canRead = session?.user?.id ? await hasPermission(session.user.id, 'payments.read') || await hasPermission(session.user.id, 'payments.manage') : false;
  if (!canRead) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get('parentId')?.trim();
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  if (!parentId || !month || !year) {
    return NextResponse.json({ error: 'Missing parentId, month, or year' }, { status: 400 });
  }

  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  if (monthNum < 1 || monthNum > 12 || yearNum < 2020 || yearNum > 2100) {
    return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
  }

  const filterByTeacher = session?.user?.id ? await shouldFilterMemorizationByTeacher(session.user.id) : false;

  const students = await prisma.student.findMany({
    where: {
      parentId,
      ...(filterByTeacher && session?.user?.id ? { teacherId: session.user.id } : {}),
      fee: { not: null },
    },
    select: { id: true, name: true, fee: true },
  });

  if (students.length === 0) {
    return NextResponse.json({
      payments: [],
      totalDue: 0,
      studentCount: 0,
      parentName: null,
    });
  }

  const parent = await prisma.user.findUnique({
    where: { id: parentId },
    select: { name: true, username: true },
  });

  const payments: { id: string; studentId: string; studentName: string; totalDue: number; amountPaid: number; balance: number; canAddReceipt: boolean }[] = [];
  const studentIds = students.map((s) => s.id);
  const feeMap = new Map(students.map((s) => [s.id, toNum(s.fee)]));

  const existingPayments = await prisma.payment.findMany({
    where: {
      studentId: { in: studentIds },
      month: monthNum,
      year: yearNum,
    },
    include: { Student: { select: { name: true, teacherId: true } } },
  });

  const bal = (p: { totalDue: unknown; amountPaid: unknown; discount?: unknown }) =>
    toNum(p.totalDue) - toNum(p.discount) - toNum(p.amountPaid);
  const nextMonthKeys = existingPayments
    .filter((p) => bal(p) > 0)
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

  for (const p of existingPayments) {
    const balance = bal(p);
    const key = `${p.studentId}:${p.month}:${p.year}`;
    const balanceWasCarried = carriedOverKeys.has(key);
    const canAddReceipt = balance > 0 && !balanceWasCarried;
    payments.push({
      id: p.id,
      studentId: p.studentId,
      studentName: (p.Student as { name?: string })?.name ?? '—',
      totalDue: toNum(p.totalDue),
      amountPaid: toNum(p.amountPaid),
      balance,
      canAddReceipt,
    });
  }

  const studentsWithPayment = new Set(payments.map((p) => p.studentId));
  for (const s of students) {
    if (studentsWithPayment.has(s.id)) continue;
    const fee = feeMap.get(s.id) ?? 0;
    const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
    const prevYear = monthNum === 1 ? yearNum - 1 : yearNum;
    const prevPayment = await prisma.payment.findUnique({
      where: { studentId_month_year: { studentId: s.id, month: prevMonth, year: prevYear } },
    });
    let balanceCarriedOver = 0;
    if (prevPayment) {
      const prevBalance = toNum(prevPayment.totalDue) - toNum((prevPayment as { discount?: unknown }).discount) - toNum(prevPayment.amountPaid);
      if (prevBalance > 0) balanceCarriedOver = prevBalance;
    }
    const totalDue = fee + balanceCarriedOver;
    payments.push({
      id: '',
      studentId: s.id,
      studentName: s.name,
      totalDue,
      amountPaid: 0,
      balance: totalDue,
      canAddReceipt: totalDue > 0,
    });
  }

  const payablePayments = payments.filter((p) => p.canAddReceipt && p.balance > 0);
  const totalDue = payablePayments.reduce((sum, p) => sum + p.balance, 0);

  return NextResponse.json({
    payments: payablePayments,
    totalDue: Math.round(totalDue * 100) / 100,
    studentCount: students.length,
    parentName: parent?.name ?? parent?.username ?? null,
  });
}
