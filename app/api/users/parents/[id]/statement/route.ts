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
        const studentPayments = s.Payment.map(p => {
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

        const totalFee = studentPayments.reduce((sum, p) => sum + p.feeAmount, 0); // Base fees only for summary
        const totalPaid = studentPayments.reduce((sum, p) => sum + p.amountPaid, 0);
        const totalDiscount = studentPayments.reduce((sum, p) => sum + p.discount, 0);
        // Current balance is the balance of the latest record (which includes carry over)
        // OR we can sum up all unpaid segments.
        // Actually, totalDue already includes balanceCarriedOver.
        // So the "Grand Total Due" is NOT just sum of totalDue.
        // It's the sum of (feeAmount - discount) across all months.
        
        const currentBalance = studentPayments.length > 0 ? studentPayments[0].balance : 0;

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
        totalPaid: students.reduce((sum, s) => {
          return sum + s.Payment.reduce((ps, p) => ps + toNum(p.amountPaid), 0);
        }, 0),
        totalBalance: students.reduce((sum, s) => {
          const latest = s.Payment[0];
          return sum + (latest ? Math.max(0, toNum(latest.totalDue) - toNum(latest.discount) - toNum(latest.amountPaid)) : 0);
        }, 0),
      }
    };

    return NextResponse.json(statement);
  } catch (error) {
    console.error('[GET parent statement] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
