/**
 * Seed payment permissions. Skips if already exist.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const paymentPermissions = [
  { name: 'payments.read', resource: 'payments', action: 'read', description: 'View payments and receipts' },
  { name: 'payments.manage', resource: 'payments', action: 'manage', description: 'Manage payments: create, add receipts, pay forward, pay by parent' },
];

async function main() {
  for (const p of paymentPermissions) {
    const existing = await prisma.permission.findUnique({ where: { name: p.name } });
    if (!existing) {
      await prisma.permission.create({ data: p });
      console.log(`Created permission: ${p.name}`);
    } else {
      console.log(`Skipped (exists): ${p.name}`);
    }
  }
  console.log('Payment permissions seeded');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
