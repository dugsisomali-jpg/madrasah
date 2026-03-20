import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    // 1. Total Income (Receipts) for the month
    const receipts = await prisma.receipt.aggregate({
      where: {
        date: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
      _sum: { amount: true },
    });

    // 2. Total Salaries for the month
    const salaries = await prisma.salaryPayment.aggregate({
      where: { month, year },
      _sum: { amount: true },
    });

    // 3. Total General Expenses for the month
    const expenses = await prisma.expense.aggregate({
      where: {
        date: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
      _sum: { amount: true },
    });

    // 4. Recent Transactions
    const [recentReceipts, recentSalaries, recentExpenses] = await Promise.all([
      prisma.receipt.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: { Payment: { include: { Student: { select: { name: true } } } } }
      }),
      prisma.salaryPayment.findMany({
        take: 5,
        orderBy: { paymentDate: 'desc' },
        include: { employee: { select: { name: true } } }
      }),
      prisma.expense.findMany({
        take: 5,
        orderBy: { date: 'desc' },
      })
    ]);

    return NextResponse.json({
      summary: {
        totalIncome: Number(receipts._sum.amount || 0),
        totalSalaries: Number(salaries._sum.amount || 0),
        totalExpenses: Number(expenses._sum.amount || 0),
        netBalance: Number(receipts._sum.amount || 0) - Number(salaries._sum.amount || 0) - Number(expenses._sum.amount || 0),
      },
      recent: {
        receipts: recentReceipts,
        salaries: recentSalaries,
        expenses: recentExpenses,
      }
    });
  } catch (error) {
    console.error('[FINANCE_STATS_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
