import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, shouldFilterMemorizationByTeacher, hasPermission, isParentRole } from '@/lib/auth-utils';
import { Decimal } from '@prisma/client/runtime/library';

function toNum(v: unknown): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v) || 0;
}

const createSingleSchema = z.object({
  studentId: z.string(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

const createBulkSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

export async function GET(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;
  const filterByParent = session?.user?.id ? await isParentRole(session.user.id) : false;
  const canRead = filterByParent || (session?.user?.id ? await hasPermission(session.user.id, 'payments.read') || await hasPermission(session.user.id, 'payments.manage') : false);
  if (!canRead) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId')?.trim();
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('perPage') || '25', 10)));
  const skip = (page - 1) * perPage;

  const filterByTeacher = session?.user?.id ? await shouldFilterMemorizationByTeacher(session.user.id) : false;
  const where: Record<string, unknown> = {};
  if (studentId) where.studentId = studentId;
  if (month) where.month = parseInt(month, 10);
  if (year) where.year = parseInt(year, 10);
  if (filterByParent && session?.user?.id) {
    where.Student = { parentId: session.user.id };
  } else if (filterByTeacher) {
    where.Student = { teacherId: session!.user!.id };
  }

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      skip,
      take: perPage,
      include: {
        Student: { select: { id: true, name: true, fee: true } },
        receipts: { orderBy: { date: 'desc' } },
      },
    }),
  ]);

  const bal = (p: { totalDue: unknown; amountPaid: unknown; discount?: unknown }) =>
    toNum(p.totalDue) - toNum(p.discount) - toNum(p.amountPaid);
  const nextMonthKeys = payments
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

  const withCanAddReceipt = payments.map((p) => {
    const balance = bal(p);
    const key = `${p.studentId}:${p.month}:${p.year}`;
    const balanceWasCarried = carriedOverKeys.has(key);
    const canAddReceipt = balance > 0 && !balanceWasCarried;
    return { ...p, canAddReceipt };
  });

  return NextResponse.json({
    payments: withCanAddReceipt,
    total,
    page,
    perPage,
  });
}

async function createPaymentForStudent(
  studentId: string,
  month: number,
  year: number,
  filterByTeacher: boolean,
  teacherId: string | undefined
) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { fee: true, teacherId: true },
  });
  if (!student) return null;
  if (filterByTeacher && student.teacherId !== teacherId) return null;
  if (student.fee == null || student.fee === undefined) return null;

  const existing = await prisma.payment.findUnique({
    where: { studentId_month_year: { studentId, month, year } },
  });
  if (existing) return null;

  const feeAmount = student.fee ? new Decimal(Number(student.fee)) : new Decimal(0);
  let balanceCarriedOver = new Decimal(0);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevPayment = await prisma.payment.findUnique({
    where: { studentId_month_year: { studentId, month: prevMonth, year: prevYear } },
  });
  if (prevPayment) {
    const prevDiscount = new Decimal(toNum((prevPayment as { discount?: unknown }).discount));
    const prevBalance = new Decimal(prevPayment.totalDue).minus(prevDiscount).minus(new Decimal(prevPayment.amountPaid));
    if (prevBalance.gt(0)) balanceCarriedOver = prevBalance;
  }
  const totalDue = feeAmount.plus(balanceCarriedOver);

  return prisma.payment.create({
    data: {
      studentId,
      month,
      year,
      feeAmount,
      balanceCarriedOver,
      totalDue,
      amountPaid: 0,
    },
    include: {
      Student: { select: { id: true, name: true, fee: true } },
      receipts: true,
    },
  });
}

export async function POST(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;
  const canManage = session?.user?.id ? await hasPermission(session.user.id, 'payments.manage') : false;
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const filterByTeacher = session?.user?.id ? await shouldFilterMemorizationByTeacher(session.user.id) : false;
  const teacherId = session?.user?.id;

  try {
    const body = await req.json();

    if (body.studentId) {
      const raw = createSingleSchema.parse(body);
      const payment = await createPaymentForStudent(raw.studentId, raw.month, raw.year, filterByTeacher, teacherId);
      if (!payment) {
        const student = await prisma.student.findUnique({ where: { id: raw.studentId }, select: { teacherId: true, fee: true } });
        if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        if (filterByTeacher && student.teacherId !== teacherId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        if (student.fee == null || student.fee === undefined) return NextResponse.json({ error: 'Student has no fee set. Set a fee amount before creating a payment.' }, { status: 400 });
        const existing = await prisma.payment.findUnique({ where: { studentId_month_year: { studentId: raw.studentId, month: raw.month, year: raw.year } } });
        if (existing) return NextResponse.json({ error: 'Payment for this month already exists' }, { status: 400 });
        return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
      }
      return NextResponse.json(payment, { status: 201 });
    }

    const raw = createBulkSchema.parse(body);
    const studentWhere: Record<string, unknown> = {};
    if (filterByTeacher && teacherId) studentWhere.teacherId = teacherId;
    studentWhere.fee = { not: null };

    const students = await prisma.student.findMany({
      where: studentWhere,
      select: { id: true, fee: true },
    });
    const studentIds = students.map((s) => s.id);
    if (studentIds.length === 0) {
      return NextResponse.json({ created: 0, skipped: 0 }, { status: 201 });
    }

    const [existing, prevMonth] = await Promise.all([
      prisma.payment.findMany({
        where: { month: raw.month, year: raw.year, studentId: { in: studentIds } },
        select: { studentId: true },
      }),
      prisma.payment.findMany({
        where: {
          month: raw.month === 1 ? 12 : raw.month - 1,
          year: raw.month === 1 ? raw.year - 1 : raw.year,
          studentId: { in: studentIds },
        },
        select: { studentId: true, totalDue: true, amountPaid: true, discount: true },
      }),
    ]);

    const existingSet = new Set(existing.map((p) => p.studentId));
    const prevByStudent = new Map(prevMonth.map((p) => [p.studentId, p]));

    const toCreate: { studentId: string; feeAmount: Decimal; balanceCarriedOver: Decimal; totalDue: Decimal }[] = [];
    for (const s of students) {
      if (existingSet.has(s.id)) continue;
      const feeAmount = s.fee ? new Decimal(Number(s.fee)) : new Decimal(0);
      let balanceCarriedOver = new Decimal(0);
      const prev = prevByStudent.get(s.id);
      if (prev) {
        const prevDiscount = new Decimal(toNum((prev as { discount?: unknown }).discount));
        const prevBalance = new Decimal(prev.totalDue).minus(prevDiscount).minus(new Decimal(prev.amountPaid));
        if (prevBalance.gt(0)) balanceCarriedOver = prevBalance;
      }
      const totalDue = feeAmount.plus(balanceCarriedOver);
      toCreate.push({ studentId: s.id, feeAmount, balanceCarriedOver, totalDue });
    }

    if (toCreate.length === 0) {
      return NextResponse.json({ created: 0, skipped: studentIds.length }, { status: 201 });
    }

    const { count } = await prisma.payment.createMany({
      data: toCreate.map((row) => ({
        studentId: row.studentId,
        month: raw.month,
        year: raw.year,
        feeAmount: row.feeAmount,
        balanceCarriedOver: row.balanceCarriedOver,
        totalDue: row.totalDue,
        discount: 0,
        amountPaid: 0,
      })),
    });

    return NextResponse.json({ created: count, skipped: studentIds.length - count }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    const message = err instanceof Error ? err.message : 'Failed to create payment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
