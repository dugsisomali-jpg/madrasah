import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, shouldFilterMemorizationByTeacher, isParentRole } from '@/lib/auth-utils';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;
  try {
    const { studentId } = await params;
    const filterByParent = session?.user?.id ? await isParentRole(session.user.id) : false;
    if (filterByParent && session?.user?.id) {
      const student = await prisma.student.findUnique({ where: { id: studentId }, select: { parentId: true } });
      if (!student || student.parentId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    const where: { studentId: string; teacherId?: string } = { studentId };
    const filterByTeacher = session?.user?.id ? await shouldFilterMemorizationByTeacher(session.user.id) : false;
    if (filterByTeacher && !filterByParent) where.teacherId = session!.user!.id;

    const records = await prisma.memorization_records.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 100,
      include: { Teacher: { select: { name: true } } },
    });
    const sabaq = records.filter((r) => r.memorizationType === 'SABAQ');
    const murajaa = records.filter((r) => r.memorizationType === 'MURAJAA');
    return NextResponse.json({
      studentId,
      sabaqCount: sabaq.length,
      murajaaCount: murajaa.length,
      recentRecords: records.slice(0, 20),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
