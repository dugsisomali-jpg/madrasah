import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';

const createSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;
  try {
    const parsed = createSchema.parse(await req.json());
    const id = `subj-${randomUUID()}`;
    const name = parsed.name.trim();
    const nameAr = parsed.nameAr?.trim() || null;
    const description = parsed.description?.trim() || null;
    // Use raw SQL only (generated client still expects "category" until prisma generate succeeds)
    await prisma.$executeRaw`
      INSERT INTO "Subject" (id, name, "nameAr", description)
      VALUES (${id}, ${name}, ${nameAr}, ${description})
    `;
    const rows = await prisma.$queryRaw<Array<{ id: string; name: string; nameAr: string | null; description: string | null }>>`
      SELECT id, name, "nameAr", description FROM "Subject" WHERE id = ${id}
    `;
    const subject = rows[0];
    if (!subject) throw new Error('Subject not found after insert');
    return NextResponse.json(subject, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    const message = err instanceof Error ? err.message : 'Failed to create subject';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const { error: authError } = await requireAuth();
  if (authError) return authError;
  const subjects = await prisma.$queryRaw<Array<{ id: string; name: string; nameAr: string | null; description: string | null }>>`
    SELECT id, name, "nameAr", description FROM "Subject" ORDER BY name ASC
  `;
  return NextResponse.json(subjects);
}
