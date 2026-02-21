import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, shouldFilterMemorizationByTeacher, hasPermission, isParentRole } from '@/lib/auth-utils';

function stripFeeIfNoPermission<T extends { fee?: unknown }>(items: T[], canViewFee: boolean): T[] {
  if (canViewFee) return items;
  return items.map(({ fee: _, ...rest }) => rest as T);
}

const createSchema = z.object({
  name: z.string().min(1),
  motherName: z.string().optional(),
  motherPhone: z.string().optional(),
  parentId: z.string().optional().nullable(),
  teacherId: z.string().optional().nullable(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  imagePath: z.string().optional(),
  fee: z.union([z.number(), z.string()]).optional().nullable().transform((v) => {
    if (v === '' || v == null) return undefined;
    const n = Number(v);
    return isNaN(n) ? undefined : n;
  }),
});

export async function POST(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;
  const canCreate = session?.user?.id
    ? (await hasPermission(session.user.id, 'students.create')) || (await hasPermission(session.user.id, 'students.manage'))
    : false;
  if (!canCreate) {
    return NextResponse.json({ error: 'Forbidden: you need students.create or students.manage permission' }, { status: 403 });
  }
  const canViewFee = session?.user?.id ? await hasPermission(session.user.id, 'students.fee_viewer') : false;
  try {
    const raw = createSchema.parse(await req.json());
    const feeVal = canViewFee && raw.fee !== '' && raw.fee != null ? Number(raw.fee) : undefined;
    const payload = {
      name: raw.name,
      motherName: raw.motherName || undefined,
      motherPhone: raw.motherPhone || undefined,
      parentId: raw.parentId || undefined,
      teacherId: raw.teacherId || undefined,
      dateOfBirth: raw.dateOfBirth ? new Date(raw.dateOfBirth) : undefined,
      address: raw.address || undefined,
      imagePath: raw.imagePath || undefined,
      fee: feeVal,
    };
    const student = await prisma.student.create({
      data: payload,
      include: {
        parent: { select: { id: true, username: true, name: true } },
        teacher: { select: { id: true, username: true, name: true } },
      },
    });
    return NextResponse.json(student, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('perPage') ?? '12', 10)));
  const q = searchParams.get('q')?.trim() ?? '';
  const parentId = searchParams.get('parentId')?.trim() ?? '';
  const dateOfBirthFrom = searchParams.get('dateOfBirthFrom')?.trim() ?? '';
  const dateOfBirthTo = searchParams.get('dateOfBirthTo')?.trim() ?? '';

  const where: Record<string, unknown> = {};

  const filterByParent = session?.user?.id ? await isParentRole(session.user.id) : false;
  if (filterByParent && session?.user?.id) {
    where.parentId = session.user.id;
  } else {
    const filterByTeacher = session?.user?.id ? await shouldFilterMemorizationByTeacher(session.user.id) : false;
    if (filterByTeacher) where.teacherId = session!.user!.id;
  }

  const canViewFee = session?.user?.id ? await hasPermission(session.user.id, 'students.fee_viewer') : false;

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { motherName: { contains: q, mode: 'insensitive' } },
      { address: { contains: q, mode: 'insensitive' } },
      { parent: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { username: { contains: q, mode: 'insensitive' } }] } },
    ];
  }
  if (parentId) {
    where.parentId = parentId;
  }
  if (dateOfBirthFrom || dateOfBirthTo) {
    where.dateOfBirth = {};
    if (dateOfBirthFrom) {
      (where.dateOfBirth as Record<string, Date>).gte = new Date(dateOfBirthFrom);
    }
    if (dateOfBirthTo) {
      (where.dateOfBirth as Record<string, Date>).lte = new Date(dateOfBirthTo);
    }
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        parent: { select: { id: true, username: true, name: true } },
        teacher: { select: { id: true, username: true, name: true } },
      },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.student.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage) || 1;
  const studentsToReturn = stripFeeIfNoPermission(students, canViewFee);
  return NextResponse.json({
    students: studentsToReturn,
    total,
    page,
    perPage,
    totalPages,
  });
}
