import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const employee = await (prisma as any).employee.findUnique({
      where: { userId: session.user.id }
    });
    if (!employee) return NextResponse.json([]); // Not an employee

    const payslips = await (prisma as any).payslip.findMany({
      where: { employeeId: employee.id },
      include: {
        payrollRun: { select: { month: true, year: true, status: true } },
      },
      orderBy: { payrollRun: { year: 'desc' } }, // Note: may need manual sort if nested
    });
    
    // Manual sort if prisma nested sort fails
    const sorted = payslips.sort((a: any, b: any) => {
        if (a.payrollRun.year !== b.payrollRun.year) return b.payrollRun.year - a.payrollRun.year;
        return b.payrollRun.month - a.payrollRun.month;
    });

    return NextResponse.json(sorted);
  } catch (err) {
    console.error('GET /api/my-payslips error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
