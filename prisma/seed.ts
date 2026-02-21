/**
 * Seed initial subjects and admin user for the Madrasah
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const subjects = [
  { id: 'subj-quran', name: 'Qur\'an Memorization (Hifz)', description: 'Memorization of the Holy Qur\'an' },
  { id: 'subj-tajweed', name: 'Tajweed', description: 'Rules of Qur\'an recitation' },
  { id: 'subj-islamic', name: 'Islamic Studies', description: 'Fiqh, Hadith, Seerah, Aqeedah' },
  { id: 'subj-arabic', name: 'Arabic', description: 'Arabic language and grammar' },
];

async function main() {
  if ((await prisma.subject.count()) === 0) {
    await prisma.subject.createMany({ data: subjects });
    console.log('Seeded subjects');
  }

  const adminUsername = 'admin';
  const passwordHash = await bcrypt.hash('admin123', 10);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).user.upsert({
    where: { username: adminUsername },
    create: { username: adminUsername, passwordHash, name: 'Admin' },
    update: { passwordHash, name: 'Admin' },
  });
  console.log('Seeded user: admin / admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
