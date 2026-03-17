import { hasPermission } from './lib/auth-utils';
import { prisma } from './lib/prisma';

async function test() {
  const adminId = 'cmmueosiz0000zdz3e8qa4xka'; // from previous diag
  const canRead = await hasPermission(adminId, 'users.read');
  console.log(`Admin (ID: ${adminId}) can read users: ${canRead}`);
  
  const macalinId = 'cmmuhth8x0000umvpgc5xz65w'; // from previous diag
  const macalinCanRead = await hasPermission(macalinId, 'users.read');
  console.log(`Macalin (ID: ${macalinId}) can read users: ${macalinCanRead}`);
}

test().then(() => prisma.$disconnect());
