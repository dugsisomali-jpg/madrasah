/**
 * GET /api/receivables — List receivables (unpaid/partially paid fees).
 * Query: studentId, month, year, status (unpaid|partial), search, page, perPage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hasPermission, isParentRole, shouldFilterMemorizationByTeacher } from '@/lib/auth-utils';
import { listReceivables } from '@/lib/receivable/receivable-service';
import type { PaymentStatus } from '@/lib/receivable/types';

const VALID_STATUS: PaymentStatus[] = ['unpaid', 'partial'];

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
  const studentId = searchParams.get('studentId')?.trim() || undefined;
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const statusParam = searchParams.get('status')?.toLowerCase();
  const status: PaymentStatus | undefined =
    statusParam && VALID_STATUS.includes(statusParam as PaymentStatus) ? (statusParam as PaymentStatus) : undefined;
  const search = searchParams.get('search')?.trim() || undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('perPage') || '25', 10)));

  const filterByTeacher = session?.user?.id ? await shouldFilterMemorizationByTeacher(session.user.id) : false;
  const options = {
    filterByParentUserId: filterByParent && session?.user?.id ? session.user.id : undefined,
    filterByTeacherUserId: filterByTeacher && session?.user?.id ? session.user.id : undefined,
  };

  try {
    const result = await listReceivables(
      {
        studentId,
        month: month ? parseInt(month, 10) : undefined,
        year: year ? parseInt(year, 10) : undefined,
        status,
        search,
        page,
        perPage,
      },
      options
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error('GET /api/receivables error:', err);
    return NextResponse.json({ error: 'Failed to list receivables' }, { status: 500 });
  }
}
