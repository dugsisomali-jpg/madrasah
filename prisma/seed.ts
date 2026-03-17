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

const permissions = [
  // Students
  { name: 'students.read', resource: 'students', action: 'read', description: 'View student list and profiles' },
  { name: 'students.create', resource: 'students', action: 'create', description: 'Add new students' },
  { name: 'students.update', resource: 'students', action: 'update', description: 'Edit student information' },
  { name: 'students.delete', resource: 'students', action: 'delete', description: 'Remove students' },
  { name: 'students.manage', resource: 'students', action: 'manage', description: 'Full student management' },
  { name: 'students.fee_viewer', resource: 'students', action: 'fee_viewer', description: 'View student fee details' },
  
  // Payments
  { name: 'payments.read', resource: 'payments', action: 'read', description: 'View payment records' },
  { name: 'payments.manage', resource: 'payments', action: 'manage', description: 'Record payments and manage receipts' },
  
  // Attendance
  { name: 'attendance.read', resource: 'attendance', action: 'read', description: 'View attendance records' },
  { name: 'attendance.manage', resource: 'attendance', action: 'manage', description: 'Record and edit attendance' },
  
  // Memorization
  { name: 'memorization.read', resource: 'memorization', action: 'read', description: 'View memorization progress' },
  { name: 'memorization.manage', resource: 'memorization', action: 'manage', description: 'Record memorization sessions' },
  
  // Exams
  { name: 'exams.read', resource: 'exams', action: 'read', description: 'View exam results' },
  { name: 'exams.manage', resource: 'exams', action: 'manage', description: 'Record and edit exam results' },
  
  // Users & Roles
  { name: 'users.manage', resource: 'users', action: 'manage', description: 'Manage system users' },
  { name: 'roles.manage', resource: 'roles', action: 'manage', description: 'Manage roles and permissions' },
  { name: 'manage.system', resource: 'system', action: 'manage', description: 'Highest system-wide privilege' },
  { name: 'system.manage', resource: 'system', action: 'manage', description: 'Master administrator privilege' },
];

async function main() {
  // 1. Seed Subjects
  if ((await prisma.subject.count()) === 0) {
    await prisma.subject.createMany({ data: subjects });
    console.log('Seeded subjects');
  }

  // 2. Seed Permissions
  console.log('Seeding permissions...');
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p.name },
      create: p,
      update: p,
    });
  }

  // 3. Seed Roles
  console.log('Seeding roles...');
  const allPermissions = await prisma.permission.findMany();
  
  // Admin Role - All permissions
  await prisma.role.upsert({
    where: { name: 'Admin' },
    create: {
      name: 'Admin',
      description: 'System Administrator with full access',
      permissions: { connect: allPermissions.map(p => ({ id: p.id })) }
    },
    update: {
      permissions: { set: allPermissions.map(p => ({ id: p.id })) }
    }
  });

  // Teacher Role
  const teacherPermNames = [
    'students.read', 
    'attendance.manage', 'attendance.read',
    'memorization.manage', 'memorization.read',
    'exams.manage', 'exams.read'
  ];
  const teacherPerms = allPermissions.filter(p => teacherPermNames.includes(p.name));
  await prisma.role.upsert({
    where: { name: 'Teacher' },
    create: {
      name: 'Teacher',
      description: 'Madrasah Teacher',
      permissions: { connect: teacherPerms.map(p => ({ id: p.id })) }
    },
    update: {
      permissions: { set: teacherPerms.map(p => ({ id: p.id })) }
    }
  });

  // Parent Role
  await prisma.role.upsert({
    where: { name: 'Parent' },
    create: { name: 'Parent', description: 'Student Parent' },
    update: {}
  });

  // 4. Seed Admin User
  const adminUsername = 'admin';
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: adminUsername },
    create: { 
      username: adminUsername, 
      passwordHash, 
      name: 'Admin',
      roles: { connect: { name: 'Admin' } }
    },
    update: { 
      passwordHash, 
      name: 'Admin',
      roles: { connect: { name: 'Admin' } }
    },
  });
  console.log('Seeded user: admin / admin123 (Role: Admin)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
