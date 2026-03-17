import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-utils';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const canManage = await hasPermission(session.user.id, 'roles.manage');
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  try {
    const data = updateSchema.parse(await req.json());
    const { permissionIds, ...rest } = data;
    const updateData: Record<string, unknown> = { ...rest };
    if (permissionIds !== undefined) {
      updateData.permissions = { set: permissionIds.map((pid) => ({ id: pid })) };
    }
    const role = await prisma.role.update({
      where: { id },
      data: updateData,
      include: { permissions: true },
    });
    return NextResponse.json(role);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
