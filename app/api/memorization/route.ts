import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, shouldFilterMemorizationByTeacher, isParentRole } from '@/lib/auth-utils';
import { MemorizationType } from '@prisma/client';

const createSchema = z
  .object({
    studentId: z.string(),
    teacherId: z.string(),
    surahNumber: z.number().int().min(1).max(114),
    ayahStart: z.number().int().min(1),
    ayahEnd: z.number().int().min(1),
    memorizationType: z.enum(['SABAQ', 'MURAJAA']),
    rating: z.number().int().min(1).max(5).optional(),
    notes: z.string().optional(),
    date: z.string().refine((s) => !isNaN(new Date(s).getTime()), { message: 'Invalid date' }),
  })
  .refine((data) => data.ayahStart <= data.ayahEnd, {
    message: 'Ayah start must be less than or equal to ayah end',
    path: ['ayahStart'],
  });

const listSchema = z.object({
  studentId: z.string().optional(),
  teacherId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  memorizationType: z.enum(['SABAQ', 'MURAJAA']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;
  try {
    const raw = await req.json();
    console.log('[memorization] POST payload:', JSON.stringify(raw));
    const data = createSchema.parse(raw);
    const record = await prisma.memorization_records.create({
      data: {
        ...data,
        memorizationType: data.memorizationType as MemorizationType,
        date: new Date(data.date),
      },
      include: {
        Student: { select: { name: true } },
        Teacher: { select: { id: true, username: true, name: true } },
      },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create memorization record' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;
  try {
    const { searchParams } = new URL(req.url);
    const params = listSchema.parse(Object.fromEntries(searchParams));
    const skip = (params.page - 1) * params.limit;

    const where: Record<string, unknown> = {};
    if (params.studentId) where.studentId = params.studentId;
    if (params.teacherId) where.teacherId = params.teacherId;

    const filterByParent = session?.user?.id ? await isParentRole(session.user.id) : false;
    if (filterByParent && session?.user?.id) {
      where.Student = { parentId: session.user.id };
    } else {
      const filterByTeacher = session?.user?.id ? await shouldFilterMemorizationByTeacher(session.user.id) : false;
      if (filterByTeacher) where.teacherId = session!.user!.id;
    }
    if (params.memorizationType) where.memorizationType = params.memorizationType;
    if (params.dateFrom || params.dateTo) {
      where.date = {};
      if (params.dateFrom) (where.date as Record<string, Date>).gte = new Date(params.dateFrom);
      if (params.dateTo) (where.date as Record<string, Date>).lte = new Date(params.dateTo);
    }

    const [records, total] = await Promise.all([
      prisma.memorization_records.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: params.limit,
        include: {
          Student: { select: { id: true, name: true } },
          Teacher: { select: { id: true, username: true, name: true } },
        },
      }),
      prisma.memorization_records.count({ where }),
    ]);

    return NextResponse.json({
      data: records,
      pagination: { page: params.page, limit: params.limit, total, totalPages: Math.ceil(total / params.limit) },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: 'Failed to fetch memorization history' }, { status: 500 });
  }
}
