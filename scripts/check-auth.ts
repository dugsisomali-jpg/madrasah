/**
 * Debug script: verify admin user exists and password works
 * Run: npx tsx scripts/check-auth.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking auth setup...\n');

  // 1. Check if User table exists and has records
  const users = await (prisma as any).user.findMany();
  console.log('Users in DB:', users.length);
  if (users.length === 0) {
    console.log('ERROR: No users found. Run: npm run db:seed');
    return;
  }

  // 2. Find admin user
  const admin = users.find((u: { username: string }) => u.username === 'admin');
  if (!admin) {
    console.log('Users found:', users.map((u: { username: string }) => u.username));
    console.log('ERROR: No "admin" user. Run: npm run db:seed');
    return;
  }

  console.log('Admin user found:', { id: admin.id, username: admin.username });
  console.log('Has passwordHash:', !!admin.passwordHash, '(length:', admin.passwordHash?.length || 0, ')');

  // 3. Verify password
  const valid = await bcrypt.compare('admin123', admin.passwordHash);
  console.log('Password "admin123" valid:', valid);

  if (!valid) {
    console.log('\nPassword mismatch. Re-seeding admin...');
    const hash = await bcrypt.hash('admin123', 10);
    await (prisma as any).user.update({
      where: { username: 'admin' },
      data: { passwordHash: hash },
    });
    console.log('Done. Try logging in again with admin / admin123');
  } else {
    console.log('\nAuth data looks correct. If login still fails, check:');
    console.log('- NEXTAUTH_SECRET is set in .env');
    console.log('- NEXTAUTH_URL is correct (e.g. http://localhost:3000)');
    console.log('- Browser cookies are enabled');
  }
}

main()
  .catch((e) => console.error('Error:', e))
  .finally(() => prisma.$disconnect());
