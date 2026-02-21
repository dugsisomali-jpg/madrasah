import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;
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
