import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      roles: { include: { permissions: { select: { name: true } } } },
      directPermissions: { select: { name: true } },
    },
  });
  if (!user) return NextResponse.json({ permissions: [] });
  const fromRoles = user.roles.flatMap((r) => r.permissions.map((p) => p.name));
  const fromDirect = user.directPermissions.map((p) => p.name);
  const permissions = [...new Set([...fromRoles, ...fromDirect])];
  return NextResponse.json({ permissions });
}
