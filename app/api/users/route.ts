import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  name: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const users = await prisma.user.findMany({
      orderBy: { username: 'asc' },
      include: {
        roles: { select: { id: true, name: true } },
        directPermissions: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(
      users.map(({ id, username, name, createdAt, roles, directPermissions }) => ({
        id,
        username,
        name,
        createdAt,
        roles,
        directPermissions: directPermissions ?? [],
      }))
    );
  } catch (err) {
    console.error('GET /api/users error:', err);
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = createSchema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing) return NextResponse.json({ error: 'Username already exists' }, { status: 400 });

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { username: data.username, passwordHash, name: data.name },
      include: {
        roles: { select: { id: true, name: true } },
        directPermissions: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        roles: user.roles,
        directPermissions: user.directPermissions ?? [],
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
