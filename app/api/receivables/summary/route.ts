/**
 * GET /api/receivables/summary?paymentId= — Receivable summary for a single fee (payment).
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hasPermission, isParentRole, shouldFilterMemorizationByTeacher } from '@/lib/auth-utils';
import { getReceivableSummaryByPaymentId } from '@/lib/receivable/receivable-service';

export async function GET(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;
  const filterByParent = session?.user?.id ? await isParentRole(session.user.id) : false;
  const canRead =
    filterByParent ||
    (session?.user?.id
      ? (await hasPermission(session.user.id, 'payments.read')) ||
        (await hasPermission(session.user.id, 'payments.manage'))
      : false);
  if (!canRead) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get('paymentId')?.trim();
  if (!paymentId) return NextResponse.json({ error: 'paymentId is required' }, { status: 400 });

  const filterByTeacher = session?.user?.id ? await shouldFilterMemorizationByTeacher(session.user.id) : false;
  const options = {
    filterByParentUserId: filterByParent && session?.user?.id ? session.user.id : undefined,
    filterByTeacherUserId: filterByTeacher && session?.user?.id ? session.user.id : undefined,
  };

  try {
    const summary = await getReceivableSummaryByPaymentId(paymentId, options);
    if (!summary) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    return NextResponse.json(summary);
  } catch (err) {
    console.error('GET /api/receivables/summary error:', err);
    return NextResponse.json({ error: 'Failed to get receivable summary' }, { status: 500 });
  }
}
