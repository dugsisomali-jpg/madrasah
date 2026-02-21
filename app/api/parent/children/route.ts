import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isParentRole } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isParent = await isParentRole(session.user.id);
  if (!isParent) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const children = await prisma.student.findMany({
    where: { parentId: session.user.id },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, motherName: true, imagePath: true, teacher: { select: { name: true, username: true } } },
  });

  return NextResponse.json(children);
}
