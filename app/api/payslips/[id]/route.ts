import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-utils';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const canManage = await hasPermission(session.user.id, 'hr.manage');
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    await (prisma as any).payslip.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
