import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-utils';

const employeeSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  accountNo: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  jobRole: z.string().optional().nullable(),
  employmentType: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'TERMINATED']).optional(),
  joinDate: z.string().optional().nullable(),
  bankDetails: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
  salaryTemplateId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true } },
        salaryTemplate: { select: { id: true, name: true } },
      },
    });
    if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    // Check if the user is the employee themselves or an HR manager
    if (employee.userId !== session.user.id) {
       const canManage = await hasPermission(session.user.id, 'hr.manage');
       if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(employee);
  } catch (err) {
    console.error('GET /api/employees/[id] error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const canManage = await hasPermission(session.user.id, 'hr.manage');
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const data = employeeSchema.parse(await req.json());
    
    // Check for unique email conflict
    if (data.email) {
      const existing = await prisma.employee.findFirst({
        where: { email: data.email, NOT: { id } }
      });
      if (existing) return NextResponse.json({ error: 'Email in use' }, { status: 400 });
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...data,
        email: data.email === '' ? null : data.email,
        joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
      },
    });

    return NextResponse.json(employee);
  } catch (err) {
    console.error('PATCH /api/employees/[id] error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const canManage = await hasPermission(session.user.id, 'hr.manage');
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    await prisma.employee.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/employees/[id] error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
