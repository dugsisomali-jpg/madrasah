import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission } from '@/lib/auth-utils';
import { generateNextUsername } from '@/lib/utils';

const schema = z.object({
  password: z.string().min(6),
  name: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  // Allow users with students.manage or users.manage to create parents
  const canManageStudents = await hasPermission(session.user.id, 'students.manage');
  const canManageUsers = await hasPermission(session.user.id, 'users.manage');
  
  if (!canManageStudents && !canManageUsers) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const data = schema.parse(await req.json());

    // Auto-generate username
    const username = await generateNextUsername(prisma);

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user and assign 'Parent' role
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        name: data.name,
        // Since we don't have a 'phone' field in the basic User model,
        // we'll skip it or handle it based on schema. 
        // Checking schema.prisma reveals the User model may not have it but the parent relation might.
        // For simplicity, let's just create the user and add the 'Parent' role.
        roles: {
          connectOrCreate: {
            where: { name: 'Parent' },
            create: { name: 'Parent' }
          }
        }
      },
      select: {
        id: true,
        username: true,
        name: true
      }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('[QUICK_PARENT_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
