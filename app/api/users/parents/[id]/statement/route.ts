import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function toNum(v: unknown): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v) || 0;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: parentId } = await params;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from'); // YYYY-MM
  const to = searchParams.get('to');     // YYYY-MM

  let fromYear: number = 2026, fromMonth: number = 1;
  let toYear: number = 2026, toMonth: number = 12;

  if (from) {
    const [y, m] = from.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m)) { fromYear = y; fromMonth = m; }
  }
  if (to) {
    const [y, m] = to.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m)) { toYear = y; toMonth = m; }
  }

  const now = new Date();
  const nowY = now.getFullYear();
  const nowM = now.getMonth() + 1;

  try {
    const parent = await prisma.user.findUnique({
      where: { id: parentId },
      select: { id: true, name: true, username: true },
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    const students = await prisma.student.findMany({
      where: { parentId },
      select: {
        id: true,
        name: true,
        fee: true,
        enrollmentDate: true,
        Payment: {
          where: {
            AND: [
              { OR: [{ year: { gt: fromYear } }, { AND: [{ year: fromYear }, { month: { gte: fromMonth } }] }] },
              { OR: [{ year: { lt: toYear } }, { AND: [{ year: toYear }, { month: { lte: toMonth } }] }] },
            ]
          },
          select: {
            id: true,
            month: true,
            year: true,
            feeAmount: true,
            balanceCarriedOver: true,
            totalDue: true,
            discount: true,
            amountPaid: true,
            balanceDueDate: true,
          },
        },
      },
    });

    // Generate month keys for the range
    const rangeKeys: string[] = [];
    let cY = fromYear, cM = fromMonth;
    while (cY < toYear || (cY === toYear && cM <= toMonth)) {
      rangeKeys.push(`${cY}-${String(cM).padStart(2, '0')}`);
      cM++;
      if (cM > 12) { cM = 1; cY++; }
    }

    const statement = {
      parentName: parent.name || parent.username,
      generatedAt: new Date().toISOString(),
      students: students.map(s => {
        const studentPayments = rangeKeys.map(key => {
          const [y, m] = key.split('-').map(Number);
          const p = s.Payment.find(pay => pay.year === y && pay.month === m);
          
          if (p) {
            const balance = toNum(p.totalDue) - toNum(p.discount) - toNum(p.amountPaid);
            return {
              id: p.id,
              month: p.month,
              year: p.year,
              feeAmount: toNum(p.feeAmount),
              amountPaid: toNum(p.amountPaid),
              balance: Math.max(0, balance),
              exists: true
            };
          } else {
            // Virtual arrears logic
            const isActive = s.enrollmentDate ? new Date(s.enrollmentDate) <= new Date(y, m - 1, 1) : true;
            const isDue = (y < nowY) || (y === nowY && m <= nowM);
            const fee = toNum(s.fee);
            return {
              id: `virtual-${y}-${m}`,
              month: m,
              year: y,
              feeAmount: fee,
              amountPaid: 0,
              balance: (isActive && isDue) ? fee : 0,
              exists: false
            };
          }
        });

        const totalPaid = studentPayments.reduce((sum, p) => sum + p.amountPaid, 0);
        const currentBalance = studentPayments.reduce((sum, p) => sum + p.balance, 0);

        return {
          studentId: s.id,
          studentName: s.name,
          currentFee: toNum(s.fee),
          payments: studentPayments,
          summary: {
            totalPaid,
            currentBalance,
          }
        };
      }),
      grandSummary: {
        totalPaid: 0,
        totalBalance: 0,
      }
    };

    statement.grandSummary.totalPaid = statement.students.reduce((sum, s) => sum + s.summary.totalPaid, 0);
    statement.grandSummary.totalBalance = statement.students.reduce((sum, s) => sum + s.summary.currentBalance, 0);

    return NextResponse.json(statement);
  } catch (error) {
    console.error('[GET parent statement] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
