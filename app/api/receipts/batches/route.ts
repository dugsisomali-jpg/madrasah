import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const canRead = await hasPermission(session.user.id, 'payments.read');
  if (!canRead) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('perPage') || '20');
  const search = searchParams.get('search') || '';

  try {
    const skip = (page - 1) * perPage;

    const where: any = {};
    if (search) {
      where.OR = [
        { receiptNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { Parent: { name: { contains: search, mode: 'insensitive' } } },
        { Parent: { username: { contains: search, mode: 'insensitive' } } },
        { Student: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [batches, total] = await Promise.all([
      prisma.receiptBatch.findMany({
        where,
        include: {
          Parent: { select: { name: true, username: true } },
          Student: { select: { name: true } },
          _count: { select: { receipts: true } }
        },
        orderBy: { date: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.receiptBatch.count({ where }),
    ]);

    return NextResponse.json({
      batches,
      pagination: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      }
    });
  } catch (error) {
    console.error('[RECEIPT_BATCHES_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
