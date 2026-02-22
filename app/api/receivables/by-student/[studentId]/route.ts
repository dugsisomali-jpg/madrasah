/**
 * GET /api/receivables/by-student/[studentId] — Receivables and payment history for one student.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hasPermission, isParentRole, shouldFilterMemorizationByTeacher } from '@/lib/auth-utils';
import { getReceivablesByStudent } from '@/lib/receivable/receivable-service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
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

  const { studentId } = await params;
  if (!studentId) return NextResponse.json({ error: 'studentId is required' }, { status: 400 });

  const filterByTeacher = session?.user?.id ? await shouldFilterMemorizationByTeacher(session.user.id) : false;
  const options = {
    filterByParentUserId: filterByParent && session?.user?.id ? session.user.id : undefined,
    filterByTeacherUserId: filterByTeacher && session?.user?.id ? session.user.id : undefined,
  };

  try {
    const view = await getReceivablesByStudent(studentId, options);
    if (!view) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    return NextResponse.json(view);
  } catch (err) {
    console.error('GET /api/receivables/by-student/[studentId] error:', err);
    return NextResponse.json({ error: 'Failed to get student receivables' }, { status: 500 });
  }
}
