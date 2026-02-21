/**
 * Clean payments and receipts tables - deletes all records.
 * Run with: npx tsx prisma/clean-payments.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const receiptsDeleted = await prisma.receipt.deleteMany();
  const paymentsDeleted = await prisma.payment.deleteMany();

  console.log(`Deleted ${receiptsDeleted.count} receipt(s) and ${paymentsDeleted.count} payment(s).`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
