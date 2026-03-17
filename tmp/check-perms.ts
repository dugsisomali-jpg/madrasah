
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      roles: { include: { permissions: true } },
      directPermissions: true,
    },
  });

  console.log('--- USERS ---');
  for (const u of users) {
    console.log(`User: ${u.username} (ID: ${u.id})`);
    console.log(`Roles: ${u.roles.map(r => r.name).join(', ') || 'None'}`);
    const perms = [
      ...u.roles.flatMap(r => r.permissions.map(p => p.name)),
      ...u.directPermissions.map(p => p.name)
    ];
    console.log(`Permissions: ${perms.join(', ') || 'None'}`);
    console.log('---');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
