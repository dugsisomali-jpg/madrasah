import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, shouldFilterMemorizationByTeacher, isParentRole } from '@/lib/auth-utils';

const createSchema = z.object({
  studentId: z.string(),
  subjectId: z.string(),
  examType: z.enum(['TERM_EXAM', 'MID_TERM', 'FINAL', 'QUIZ']),
  term: z.string(),
  marks: z.number(),
  maxMarks: z.number(),
  report: z.string().optional(),
  date: z.string(),
});

export async function POST(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;
  const filterByTeacher = session?.user?.id ? await shouldFilterMemorizationByTeacher(session.user.id) : false;
  try {
    const data = createSchema.parse(await req.json());
    if (filterByTeacher && session?.user?.id) {
      const student = await prisma.student.findUnique({
        where: { id: data.studentId },
        select: { teacherId: true },
      });
      if (!student || student.teacherId !== session.user.id) {
        return NextResponse.json({ error: 'You can only add exam results for your assigned students' }, { status: 403 });
      }
    }
    const result = await prisma.examResult.create({
      data: {
        id: crypto.randomUUID(),
        ...data,
        date: new Date(data.date),
        marks: data.marks,
        maxMarks: data.maxMarks,
      },
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create exam result' }, { status: 500 });
  }
}

function toNum(v: unknown): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v) || 0;
}

export async function GET(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;
  const filterByParent = session?.user?.id ? await isParentRole(session.user.id) : false;
  const filterByTeacher = session?.user?.id ? await shouldFilterMemorizationByTeacher(session.user.id) : false;
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const subjectId = searchParams.get('subjectId');
  const parentId = searchParams.get('parentId')?.trim();
  const teacherId = searchParams.get('teacherId')?.trim();
  const sort = searchParams.get('sort'); // 'lowest' | 'highest' | default: date desc

  const studentWhere: Record<string, unknown> = {};
  if (filterByParent && session?.user?.id) {
    studentWhere.parentId = session.user.id;
  } else if (filterByTeacher && session?.user?.id) {
    studentWhere.teacherId = session.user.id;
  }
  if (parentId) studentWhere.parentId = parentId;
  if (teacherId) studentWhere.teacherId = teacherId;

  const where: Record<string, unknown> = {};
  if (studentId) where.studentId = studentId;
  if (subjectId) where.subjectId = subjectId;
  if (Object.keys(studentWhere).length) where.Student = studentWhere;

  let results = await prisma.examResult.findMany({
    where: Object.keys(where).length ? where : undefined,
    include: { Subject: true, Student: { select: { id: true, name: true } } },
    orderBy: { date: 'desc' },
  });

  if (sort === 'lowest' || sort === 'highest') {
    const dir = sort === 'lowest' ? 1 : -1;
    results = results.sort((a, b) => {
      const pctA = toNum(a.maxMarks) > 0 ? toNum(a.marks) / toNum(a.maxMarks) : 0;
      const pctB = toNum(b.maxMarks) > 0 ? toNum(b.marks) / toNum(b.maxMarks) : 0;
      return dir * (pctA - pctB);
    });
  }

  return NextResponse.json(results);
}
