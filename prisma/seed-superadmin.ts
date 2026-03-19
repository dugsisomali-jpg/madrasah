import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = 'superadmin';
  const password = 'superadmin123'; // The user should change this immediately
  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. Ensure 'manage.system' permission exists
  const permission = await prisma.permission.upsert({
    where: { name: 'manage.system' },
    update: {},
    create: {
      name: 'manage.system',
      description: 'Highest system-wide privilege',
      resource: 'system',
      action: 'manage',
    },
  });

  // 2. Ensure 'admin' role exists and has this permission
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {
      permissions: {
        connect: { id: permission.id },
      },
    },
    create: {
      name: 'admin',
      description: 'Full system access',
      permissions: {
        connect: { id: permission.id },
      },
    },
  });

  // 3. Create/Update superadmin user
  const user = await prisma.user.upsert({
    where: { username },
    update: {
      passwordHash: hashedPassword,
      roles: {
        connect: { id: adminRole.id },
      },
    },
    create: {
      username,
      passwordHash: hashedPassword,
      name: 'Super Administrator',
      roles: {
        connect: { id: adminRole.id },
      },
    },
  });

  console.log(`
==================================================
Superadmin Credential Created Successfully!
==================================================
Username: ${username}
Password: ${password}
Role: Admin (Full Access)
==================================================
PLEASE LOG IN AND CHANGE YOUR PASSWORD IMMEDIATELY.
==================================================
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
