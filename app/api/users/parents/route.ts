import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const searchParams = req.nextUrl.searchParams;
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();
  const hasStudents = searchParams.get('hasStudents') === 'true';

  const users = await prisma.user.findMany({
    where: {
      // Parents: users who have at least one child (student with parentId)
      // Also include users with "parent" role for backwards compatibility
      ...(hasStudents
        ? { children: { some: {} } }
        : { roles: { some: { name: 'parent' } } }),
      ...(q && {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      }),
    },
    orderBy: { username: 'asc' },
    select: { id: true, username: true, name: true },
  });

  return NextResponse.json(users);
}
