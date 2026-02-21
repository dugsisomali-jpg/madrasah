import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { session: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { session, error: null };
}

/** True if user has the given permission (via roles or directPermissions). */
export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: { include: { permissions: { select: { name: true } } } },
      directPermissions: { select: { name: true } },
    },
  });
  if (!user) return false;
  const fromRoles = user.roles.flatMap((r) => r.permissions.map((p) => p.name));
  const fromDirect = user.directPermissions.map((p) => p.name);
  const allPerms = [...fromRoles, ...fromDirect].map((n) => (n || '').toLowerCase());
  return allPerms.includes(permissionName.toLowerCase());
}

/** True if current user should only see memorization records they recorded. Admins see all; everyone else (teachers, users with no role) sees only their own. */
export async function shouldFilterMemorizationByTeacher(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { select: { name: true } } },
  });
  if (!user) return true; // safe default: filter if user not found
  const roleNames = user.roles.map((r) => (r.name || '').toLowerCase());
  const hasAdmin = roleNames.includes('admin');
  return !hasAdmin;
}

/** True if user has the parent role. Parents see only their own children's data. */
export async function isParentRole(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { select: { name: true } } },
  });
  if (!user) return false;
  const roleNames = user.roles.map((r) => (r.name || '').toLowerCase());
  return roleNames.includes('parent');
}
