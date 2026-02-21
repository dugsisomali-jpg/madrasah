import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';

const categories = ['QURAN', 'TAJWEED', 'ISLAMIC_STUDIES', 'ARABIC', 'OTHER'] as const;
const createSchema = z.object({
  name: z.string().min(1),
  category: z.enum(categories),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;
  try {
    const data = createSchema.parse(await req.json());
    const subject = await prisma.subject.create({ data });
    return NextResponse.json(subject, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
  }
}

export async function GET() {
  const { error: authError } = await requireAuth();
  if (authError) return authError;
  const subjects = await prisma.subject.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(subjects);
}
