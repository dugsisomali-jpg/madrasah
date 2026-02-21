import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, shouldFilterMemorizationByTeacher, hasPermission } from '@/lib/auth-utils';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  motherName: z.string().optional(),
  motherPhone: z.string().optional(),
  dateOfBirth: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  teacherId: z.string().optional().nullable(),
  address: z.string().optional(),
  imagePath: z.string().optional().nullable(),
  fee: z.union([z.number(), z.string()]).optional().nullable().transform((v) => {
    if (v === '' || v == null) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  }),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const filterByTeacher = session?.user?.id ? await shouldFilterMemorizationByTeacher(session.user.id) : false;

  let student = await prisma.student.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, username: true, name: true } },
      teacher: { select: { id: true, username: true, name: true } },
      memorization_records: {
        take: 10,
        orderBy: { date: 'desc' },
        ...(filterByTeacher && session?.user?.id ? { where: { teacherId: session.user.id } } : {}),
      },
      ExamResult: { take: 10, include: { Subject: true }, orderBy: { date: 'desc' } },
    },
  });
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  if (filterByTeacher && session?.user?.id && student.teacherId !== session.user.id) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const canViewFee = session?.user?.id ? await hasPermission(session.user.id, 'students.fee_viewer') : false;
  const { fee, ...rest } = student;
  const studentToReturn = canViewFee ? student : rest;
  return NextResponse.json(studentToReturn);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;
  const canEdit = session?.user?.id
    ? (await hasPermission(session.user.id, 'students.create')) || (await hasPermission(session.user.id, 'students.manage'))
    : false;
  if (!canEdit) {
    return NextResponse.json({ error: 'Forbidden: you need students.create or students.manage permission' }, { status: 403 });
  }
  const { id } = await params;
  const filterByTeacher = session?.user?.id ? await shouldFilterMemorizationByTeacher(session.user.id) : false;
  if (filterByTeacher) {
    const existing = await prisma.student.findUnique({ where: { id }, select: { teacherId: true } });
    if (!existing) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    if (existing.teacherId !== session!.user!.id) {
      return NextResponse.json({ error: 'Forbidden: you can only edit students assigned to you' }, { status: 403 });
    }
  }
  const canViewFee = session?.user?.id ? await hasPermission(session.user.id, 'students.fee_viewer') : false;
  try {
    const raw = updateSchema.parse(await req.json());
    const data: Record<string, unknown> = {};
    if (raw.name !== undefined) data.name = raw.name;
    if (raw.motherName !== undefined) data.motherName = raw.motherName || null;
    if (raw.motherPhone !== undefined) data.motherPhone = raw.motherPhone || null;
    if (raw.dateOfBirth !== undefined) data.dateOfBirth = raw.dateOfBirth ? new Date(raw.dateOfBirth) : null;
    if (raw.parentId !== undefined) data.parentId = raw.parentId || null;
    if (raw.teacherId !== undefined) data.teacherId = raw.teacherId || null;
    if (raw.address !== undefined) data.address = raw.address || null;
    if (raw.imagePath !== undefined) data.imagePath = raw.imagePath || null;
    if (canViewFee && raw.fee !== undefined) data.fee = raw.fee;

    const student = await prisma.student.update({
      where: { id },
      data,
      include: {
        parent: { select: { id: true, username: true, name: true } },
        teacher: { select: { id: true, username: true, name: true } },
      },
    });
    return NextResponse.json(student);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}
