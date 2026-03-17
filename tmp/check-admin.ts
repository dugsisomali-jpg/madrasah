import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking Admin User...');
  const user = await prisma.user.findFirst({
    where: { username: 'admin' },
    include: {
      roles: { include: { permissions: true } },
      directPermissions: true,
    },
  });

  if (!user) {
    console.log('User "admin" not found.');
    return;
  }

  console.log('User Found:', user.username);
  console.log('Roles:', user.roles.map(r => r.name));
  console.log('Permissions (names):', user.roles.flatMap(r => r.permissions.map(p => p.name)));
  console.log('Direct Permissions:', user.directPermissions.map(p => p.name));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
