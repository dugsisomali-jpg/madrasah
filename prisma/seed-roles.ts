/**
 * Seed roles and permissions for user management
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
  { name: 'users.manage', resource: 'users', action: 'manage', description: 'Full user management' },
  { name: 'users.read', resource: 'users', action: 'read', description: 'View users' },
  { name: 'roles.manage', resource: 'roles', action: 'manage', description: 'Manage roles' },
  { name: 'permissions.manage', resource: 'permissions', action: 'manage', description: 'Manage permissions' },
  { name: 'memorization.manage', resource: 'memorization', action: 'manage', description: 'Manage memorization records' },
  { name: 'memorization.read', resource: 'memorization', action: 'read', description: 'View memorization' },
  { name: 'students.manage', resource: 'students', action: 'manage', description: 'Manage students' },
  { name: 'students.create', resource: 'students', action: 'create', description: 'Create students' },
  { name: 'students.fee_viewer', resource: 'students', action: 'fee_viewer', description: 'View student fee amount' },
  { name: 'teachers.manage', resource: 'teachers', action: 'manage', description: 'Manage teachers' },
  { name: 'teachers.read', resource: 'teachers', action: 'read', description: 'View teachers list' },
  { name: 'exams.manage', resource: 'exams', action: 'manage', description: 'Manage exam results' },
  { name: 'payments.manage', resource: 'payments', action: 'manage', description: 'Manage payments and receipts' },
  { name: 'payments.read', resource: 'payments', action: 'read', description: 'View payments' },
  { name: 'attendance.manage', resource: 'attendance', action: 'manage', description: 'Manage student attendance' },
  { name: 'attendance.read', resource: 'attendance', action: 'read', description: 'View attendance' },
  { name: 'subjects.manage', resource: 'subjects', action: 'manage', description: 'Manage academic subjects' },
  { name: 'subjects.read', resource: 'subjects', action: 'read', description: 'View subjects' },
  { name: 'system.manage', resource: 'system', action: 'manage', description: 'Master administrator privilege' },
  { name: 'manage.system', resource: 'system', action: 'manage', description: 'Highest system-wide privilege' },
];

const roles = [
  { name: 'admin', description: 'Full system access' },
  { name: 'teacher', description: 'Can manage memorization, students, teachers, exams' },
  { name: 'parent', description: 'Parent of student(s) - can be linked to students' },
  { name: 'viewer', description: 'Read-only access' },
];

async function main() {
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: p,
      create: p,
    });
  }
  console.log('Seeded permissions');

  const allPerms = await prisma.permission.findMany();
  const adminPerms = allPerms;
  const teacherPerms = allPerms.filter((p) => 
    ['memorization.manage', 'attendance.manage', 'students.manage', 'exams.manage', 'memorization.read', 'students.read', 'teachers.read', 'attendance.read', 'subjects.read'].includes(p.name)
  );
  const parentPerms = allPerms.filter((p) => 
    p.action === 'read' || ['memorization.read', 'students.read', 'attendance.read', 'payments.read'].includes(p.name)
  );
  const viewerPerms = allPerms.filter((p) => 
    p.action === 'read' || p.name.endsWith('.read')
  );

  for (const r of roles) {
    let role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description },
    });

    const permIds =
      r.name === 'admin' ? adminPerms
      : r.name === 'teacher' ? teacherPerms
      : r.name === 'parent' ? parentPerms
      : viewerPerms;

    await prisma.role.update({
      where: { id: role.id },
      data: { permissions: { set: permIds.map((p) => ({ id: p.id })) } },
    });
  }
  console.log('Seeded roles');

  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  if (adminRole) {
    const adminUser = await prisma.user.findFirst({ where: { username: 'admin' } });
    if (adminUser) {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { roles: { connect: [{ id: adminRole.id }] } },
      });
      console.log('Assigned admin role to admin user');
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
