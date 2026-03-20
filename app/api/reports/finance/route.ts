import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  try {
    const dateQuery: any = {};
    if (from || to) {
      if (from) dateQuery.gte = new Date(from);
      if (to) dateQuery.lte = new Date(to);
    }

    // 1. Fetch Income (Receipts)
    const incomeData = await prisma.receipt.findMany({
      where: from || to ? { date: dateQuery } : {},
      select: { amount: true, date: true }
    });
    const totalIncome = incomeData.reduce((sum: number, r: any) => sum + Number(r.amount), 0);

    // 2. Fetch Expenses
    const expenseData = await prisma.expense.findMany({
      where: from || to ? { date: dateQuery } : {},
    });
    const totalExpenses = expenseData.reduce((sum: number, e: any) => sum + Number(e.amount), 0);

    // 3. Fetch Payroll (Salary Payments)
    const salaryData = await prisma.salaryPayment.findMany({
      where: from || to ? { paymentDate: dateQuery } : {},
    });
    const totalPayroll = salaryData.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    // 4. Category Breakdown for Expenses
    const expenseCategories: Record<string, number> = {};
    expenseData.forEach((e: any) => {
      expenseCategories[e.category] = (expenseCategories[e.category] || 0) + Number(e.amount);
    });
    expenseCategories['Payroll'] = totalPayroll;

    // 5. Fetch Detailed Transactions (Recent 50)
    const recentReceipts = await prisma.receipt.findMany({
      where: from || to ? { date: dateQuery } : {},
      take: 20,
      orderBy: { date: 'desc' },
      include: { 
        Payment: { 
          include: { Student: { select: { name: true } } } 
        } 
      }
    });

    const recentExpenses = await prisma.expense.findMany({
      where: from || to ? { date: dateQuery } : {},
      take: 15,
      orderBy: { date: 'desc' },
    });

    const recentSalaries = await prisma.salaryPayment.findMany({
      where: from || to ? { paymentDate: dateQuery } : {},
      take: 15,
      orderBy: { paymentDate: 'desc' },
      include: { employee: { select: { name: true } } }
    });

    const transactions = [
      ...recentReceipts.map((r: any) => ({
        id: r.id,
        date: r.date,
        description: `Fee Payment - ${r.Payment.Student.name}`,
        category: 'Student Fees',
        type: 'INCOME',
        amount: Number(r.amount)
      })),
      ...recentExpenses.map((e: any) => ({
        id: e.id,
        date: e.date,
        description: e.description,
        category: e.category,
        type: 'EXPENSE',
        amount: Number(e.amount)
      })),
      ...recentSalaries.map((s: any) => ({
        id: s.id,
        date: s.paymentDate,
        description: `Salary - ${s.employee.name}`,
        category: 'Payroll',
        type: 'EXPENSE',
        amount: Number(s.amount)
      }))
    ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      summary: {
        totalIncome,
        totalExpenses: totalExpenses + totalPayroll,
        netProfit: totalIncome - (totalExpenses + totalPayroll),
      },
      breakdown: {
        expenses: expenseCategories,
        income: { 'Student Fees': totalIncome }
      },
      transactions: transactions.slice(0, 50)
    });
  } catch (error) {
    console.error('[FINANCE_REPORT_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
