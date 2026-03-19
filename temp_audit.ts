import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.systemSetting.findMany();
  console.log('--- SETTINGS START ---');
  console.log(JSON.stringify(settings, null, 2));
  console.log('--- SETTINGS END ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
