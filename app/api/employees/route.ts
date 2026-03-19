import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-utils';

const employeeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  accountNo: z.string().optional(),
  department: z.string().optional(),
  jobRole: z.string().optional(),
  employmentType: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'TERMINATED']).optional(),
  joinDate: z.string().optional(),
  bankDetails: z.string().optional(),
  userId: z.string().optional().nullable(),
  salaryTemplateId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const canRead = await hasPermission(session.user.id, 'employees.read') || await hasPermission(session.user.id, 'hr.manage');
  if (!canRead) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const employees = await prisma.employee.findMany({
      include: {
        user: { select: { id: true, username: true } },
        salaryTemplate: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(employees);
  } catch (err) {
    console.error('GET /api/employees error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const canManage = await hasPermission(session.user.id, 'hr.manage');
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const data = employeeSchema.parse(await req.json());
    
    // Check for unique fields
    if (data.email) {
      const existing = await prisma.employee.findUnique({ where: { email: data.email } });
      if (existing) return NextResponse.json({ error: 'Email exists' }, { status: 400 });
    }

    if (data.userId) {
      const existing = await prisma.employee.findUnique({ where: { userId: data.userId } });
      if (existing) return NextResponse.json({ error: 'User already assigned' }, { status: 400 });
    }

    const employee = await prisma.employee.create({
      data: {
        ...data,
        email: data.email || null,
        joinDate: data.joinDate ? new Date(data.joinDate) : null,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (err) {
    console.error('POST /api/employees error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
