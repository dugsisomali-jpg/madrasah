/**
 * GET /api/receivables/dashboard — Dashboard metrics (outstanding, overdue, count, trend, aging).
 */

import { NextResponse } from 'next/server';
import { requireAuth, hasPermission, isParentRole, shouldFilterMemorizationByTeacher } from '@/lib/auth-utils';
import { getReceivableDashboardMetrics } from '@/lib/receivable/receivable-service';

export async function GET() {
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

  const filterByTeacher = session?.user?.id ? await shouldFilterMemorizationByTeacher(session.user.id) : false;
  const options = {
    filterByParentUserId: filterByParent && session?.user?.id ? session.user.id : undefined,
    filterByTeacherUserId: filterByTeacher && session?.user?.id ? session.user.id : undefined,
  };

  try {
    const metrics = await getReceivableDashboardMetrics(options);
    return NextResponse.json(metrics);
  } catch (err) {
    console.error('GET /api/receivables/dashboard error:', err);
    return NextResponse.json({ error: 'Failed to get receivable dashboard' }, { status: 500 });
  }
}
