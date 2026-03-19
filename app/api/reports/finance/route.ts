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
    const totalIncome = incomeData.reduce((sum, r) => sum + Number(r.amount), 0);

    // 2. Fetch Expenses
    const expenseData = await prisma.expense.findMany({
      where: from || to ? { date: dateQuery } : {},
    });
    const totalExpenses = expenseData.reduce((sum, e) => sum + Number(e.amount), 0);

    // 3. Fetch Payroll (Salary Payments)
    const payrollData = await prisma.salaryPayment.findMany({
      where: from || to ? { paymentDate: dateQuery } : {},
    });
    const totalPayroll = payrollData.reduce((sum, p) => sum + Number(p.amount), 0);

    // Category Breakdown for Expenses
    const expenseCategories: Record<string, number> = {};
    expenseData.forEach(e => {
      expenseCategories[e.category] = (expenseCategories[e.category] || 0) + Number(e.amount);
    });
    expenseCategories['Payroll'] = totalPayroll;

    return NextResponse.json({
      summary: {
        totalIncome,
        totalExpenses: totalExpenses + totalPayroll,
        netProfit: totalIncome - (totalExpenses + totalPayroll),
      },
      breakdown: {
        expenses: expenseCategories,
        // For income, we currently only have One 'Student Fees' category implicitly
        income: { 'Student Fees': totalIncome }
      }
    });
  } catch (error) {
    console.error('[FINANCE_REPORT_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
