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

  let fromYear: number | undefined, fromMonth: number | undefined;
  let toYear: number | undefined, toMonth: number | undefined;

  if (from) {
    const [y, m] = from.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m)) { fromYear = y; fromMonth = m; }
  }
  if (to) {
    const [y, m] = to.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m)) { toYear = y; toMonth = m; }
  }

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
        Payment: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
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
            receipts: {
              select: {
                id: true,
                amount: true,
                date: true,
                receiptNumber: true,
              },
            },
          },
        },
      },
    });

    const statement = {
      parentName: parent.name || parent.username,
      generatedAt: new Date().toISOString(),
      students: students.map(s => {
        let studentPayments = s.Payment.map(p => {
          const balance = toNum(p.totalDue) - toNum(p.discount) - toNum(p.amountPaid);
          return {
            id: p.id,
            month: p.month,
            year: p.year,
            feeAmount: toNum(p.feeAmount),
            balanceCarriedOver: toNum(p.balanceCarriedOver),
            totalDue: toNum(p.totalDue),
            discount: toNum(p.discount),
            amountPaid: toNum(p.amountPaid),
            balance: Math.max(0, balance),
            balanceDueDate: p.balanceDueDate,
            receipts: p.receipts,
          };
        });

        // Filter by date range in JS
        if (fromYear !== undefined && fromMonth !== undefined) {
          studentPayments = studentPayments.filter(p => 
            p.year > fromYear || (p.year === fromYear && p.month >= fromMonth)
          );
        }
        if (toYear !== undefined && toMonth !== undefined) {
          studentPayments = studentPayments.filter(p => 
            p.year < toYear || (p.year === toYear && p.month <= toMonth)
          );
        }

        const totalPaid = studentPayments.reduce((sum, p) => sum + p.amountPaid, 0);
        const totalDiscount = studentPayments.reduce((sum, p) => sum + p.discount, 0);
        const currentBalance = studentPayments.reduce((sum, p) => sum + p.balance, 0);

        return {
          studentId: s.id,
          studentName: s.name,
          currentFee: toNum(s.fee),
          payments: studentPayments,
          summary: {
            totalPaid,
            totalDiscount,
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
