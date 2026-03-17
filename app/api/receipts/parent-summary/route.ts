import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;
  const canManage = session?.user?.id ? await hasPermission(session.user.id, 'payments.manage') : false;
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get('batchId');

  if (!batchId) {
    return NextResponse.json({ error: 'batchId is required' }, { status: 400 });
  }

  try {
    const batch = await prisma.receiptBatch.findUnique({
      where: { id: batchId },
      include: {
        Parent: { select: { name: true, username: true } },
        Student: { select: { name: true } },
        receipts: {
          include: {
            Payment: {
              include: {
                Student: { select: { name: true } },
              }
            }
          }
        }
      }
    });

    if (!batch) {
      return NextResponse.json({ error: 'Receipt batch not found' }, { status: 404 });
    }

    // Process data for the frontend
    // We group receipts by student for a cleaner summary
    const studentsMap = new Map();

    batch.receipts.forEach(r => {
      const sId = r.Payment.studentId;
      if (!studentsMap.has(sId)) {
        studentsMap.set(sId, {
          studentName: r.Payment.Student.name,
          feePerMonth: Number(r.Payment.feeAmount),
          totalDue: Number(r.Payment.totalDue),
          discount: Number(r.Payment.discount || 0),
          amountPaid: 0,
          periods: []
        });
      }
      const s = studentsMap.get(sId);
      s.amountPaid += Number(r.amount);
      s.periods.push({
        month: r.Payment.month,
        year: r.Payment.year,
        amount: Number(r.amount)
      });
    });

    const summary = {
      batchId: batch.id,
      receiptNumber: batch.receiptNumber,
      date: batch.date,
      totalAmount: Number(batch.totalAmount),
      parentName: batch.Parent?.name || batch.Parent?.username || batch.Student?.name || 'Valued Parent',
      notes: batch.notes,
      students: Array.from(studentsMap.values())
    };

    return NextResponse.json(summary);
  } catch (err) {
    console.error('[GET /api/receipts/parent-summary] error:', err);
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}
