import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper to map legacy keys to standardized ones
const LEGACY_MAP: Record<string, string> = {
  'madrasah_name': 'name',
  'madrasah_logo': 'logo',
  'madrasah_favicon': 'favicon',
  'madrasah_address': 'address',
  'madrasah_phone': 'phone',
  'madrasah_email': 'email',
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const settings = await prisma.systemSetting.findMany();
    
    // Virtual migration: if legacy key exists but standard doesn't, alias it
    const map: Record<string, any> = {};
    settings.forEach(s => {
      map[s.key] = s;
      const standardized = LEGACY_MAP[s.key];
      if (standardized && !settings.some(x => x.key === standardized)) {
        map[standardized] = { ...s, key: standardized };
      }
    });

    return NextResponse.json(Object.values(map));
  } catch (error) {
    console.error('[SETTINGS_GET]', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { roles: { include: { permissions: true } }, directPermissions: true },
  });

  const allPermissions = [
    ...(user?.roles.flatMap(r => r.permissions.map(p => p.name)) || []),
    ...(user?.directPermissions.map(p => p.name) || [])
  ];

  const isAdmin = user?.roles.some(r => r.name.toLowerCase() === 'admin' || r.name.toLowerCase() === 'superadmin');
  const hasSystemPerm = allPermissions.includes('manage.system') || allPermissions.includes('system.manage') || allPermissions.includes('manage.all');

  if (!isAdmin && !hasSystemPerm) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { key, value, description } = body;

    if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });

    // Transaction to upsert new key and CLEAN UP legacy key if it exists
    const result = await prisma.$transaction(async (tx) => {
      const setting = await tx.systemSetting.upsert({
        where: { key },
        update: { value, description: description || null },
        create: { key, value, description: description || null },
      });

      // If we are saving a standard key, delete the legacy one to avoid "Double state"
      const legacyKey = Object.keys(LEGACY_MAP).find(k => LEGACY_MAP[k] === key);
      if (legacyKey) {
        await tx.systemSetting.deleteMany({ where: { key: legacyKey } });
      }

      return setting;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[SETTINGS_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
