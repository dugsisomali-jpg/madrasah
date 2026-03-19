import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const canManage = await hasPermission(session.user.id, 'hr.manage');
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const payslips = await prisma.payslip.findMany({
      where: { payrollRunId: id },
      include: {
        employee: { select: { id: true, name: true, jobRole: true, department: true } },
      },
      orderBy: { employee: { name: 'asc' } },
    });
    return NextResponse.json(payslips);
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const canManage = await hasPermission(session.user.id, 'hr.manage');
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { employeeId } = await req.json();
    
    // 1. Check if payslip already exists for this employee in this run
    const existing = await prisma.payslip.findFirst({
      where: { payrollRunId: id, employeeId }
    });
    if (existing) return NextResponse.json({ error: 'Employee already added to this run' }, { status: 400 });

    // 2. Get employee with template
    const emp = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        salaryTemplate: {
          include: { components: { include: { component: true } } }
        }
      }
    });
    if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

    // 3. Calculate from template
    let gross = 0;
    let deductions = 0;

    if (emp.salaryTemplate) {
      emp.salaryTemplate.components.forEach((c: any) => {
        if (c.component.type === 'EARNING') gross += Number(c.amount);
        else deductions += Number(c.amount);
      });
    }

    // 4. Create Payslip
    const payslip = await prisma.payslip.create({
      data: {
        payrollRunId: id,
        employeeId: emp.id,
        grossEarnings: gross,
        totalDeductions: deductions,
        netSalary: gross - deductions,
        status: 'PENDING'
      },
      include: {
        employee: { select: { id: true, name: true, jobRole: true, department: true } }
      }
    });

    return NextResponse.json(payslip, { status: 201 });
  } catch (err) {
    console.error('POST /api/payroll-runs/[id]/payslips error:', err);
    return NextResponse.json({ error: 'Failed to generate manual payslip' }, { status: 500 });
  }
}
