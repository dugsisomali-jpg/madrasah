import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateSchema = z.object({
  username: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  name: z.string().optional(),
  roleIds: z.array(z.string()).optional(),
  permissionIds: z.array(z.string()).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      roles: { select: { id: true, name: true } },
      directPermissions: { select: { id: true, name: true } },
    },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    const data = updateSchema.parse(await req.json());
    const { roleIds, permissionIds, password, username: newUsername, ...rest } = data;
    const updateData: Record<string, unknown> = { ...rest };
    if (newUsername !== undefined) {
      const existing = await prisma.user.findUnique({ where: { username: newUsername } });
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: 'Username already in use' }, { status: 400 });
      }
      updateData.username = newUsername;
    }
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    if (roleIds !== undefined) {
      updateData.roles = { set: roleIds.map((rid) => ({ id: rid })) };
    }
    if (permissionIds !== undefined) {
      updateData.directPermissions = { set: permissionIds.map((pid) => ({ id: pid })) };
    }
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        roles: { select: { id: true, name: true } },
        directPermissions: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
