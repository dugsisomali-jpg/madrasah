import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  nameAr: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);
    const updates: string[] = [];
    const values: (string | null)[] = [];
    let i = 0;
    if (data.name !== undefined) {
      updates.push(`name = $${++i}`);
      values.push(data.name);
    }
    if (data.nameAr !== undefined) {
      updates.push(`"nameAr" = $${++i}`);
      values.push(data.nameAr);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${++i}`);
      values.push(data.description);
    }
    if (updates.length === 0) {
      const rows = await prisma.$queryRaw<Array<{ id: string; name: string; nameAr: string | null; description: string | null }>>`
        SELECT id, name, "nameAr", description FROM "Subject" WHERE id = ${id}
      `;
      const subject = rows[0];
      if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
      return NextResponse.json(subject);
    }
    values.push(id);
    await prisma.$executeRawUnsafe(
      `UPDATE "Subject" SET ${updates.join(', ')} WHERE id = $${++i}`,
      ...values
    );
    const rows = await prisma.$queryRaw<Array<{ id: string; name: string; nameAr: string | null; description: string | null }>>`
      SELECT id, name, "nameAr", description FROM "Subject" WHERE id = ${id}
    `;
    const subject = rows[0];
    if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    return NextResponse.json(subject);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const count = await prisma.examResult.count({ where: { subjectId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete subject with existing exam results' },
        { status: 400 }
      );
    }
    await prisma.$executeRaw`DELETE FROM "Subject" WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
  }
}
