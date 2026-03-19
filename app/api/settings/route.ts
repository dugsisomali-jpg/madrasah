import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error('[SETTINGS_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only admins or system managers can update settings
  // Assuming 'manage.system' or 'system.manage' permission
  // For now, checking if user has ANY system-level permission or is Admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { roles: { include: { permissions: true } }, directPermissions: true },
  });

  const allPermissions = [
    ...(user?.roles.flatMap(r => r.permissions.map(p => p.name)) || []),
    ...(user?.directPermissions.map(p => p.name) || [])
  ];

  if (!allPermissions.includes('manage.system') && !allPermissions.includes('system.manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { key, value, description } = body;

    if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error('[SETTINGS_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
