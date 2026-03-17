import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Find user by ID, with username as fallback if ID changed (e.g. after re-seed)
  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      roles: { include: { permissions: { select: { name: true } } } },
      directPermissions: { select: { name: true } },
    },
  });

  if (!user && session.user.username) {
    user = await prisma.user.findUnique({
      where: { username: session.user.username },
      include: {
        roles: { include: { permissions: { select: { name: true } } } },
        directPermissions: { select: { name: true } },
      },
    });
  }

  if (!user) return NextResponse.json({ permissions: [] });

  const fromRoles = user.roles.flatMap((r) => r.permissions.map((p) => p.name));
  const fromDirect = user.directPermissions.map((p) => p.name);
  const permissions = [...new Set([...fromRoles, ...fromDirect])].map((p: any) => (p || '').toLowerCase());
  
  const hasAdminRole = user.roles.some((r: any) => (r.name || '').toLowerCase() === 'admin');
  const isHardcodedAdmin = user.username.toLowerCase() === 'admin';

  if (hasAdminRole || isHardcodedAdmin) {
    if (!permissions.includes('system.manage')) permissions.push('system.manage');
    if (!permissions.includes('manage.system')) permissions.push('manage.system');
  }

  return NextResponse.json({ permissions });
}
