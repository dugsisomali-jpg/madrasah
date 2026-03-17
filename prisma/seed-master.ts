import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const permissions = [
  // Users & Roles
  { name: 'users.read', resource: 'users', action: 'read', description: 'View system users' },
  { name: 'users.manage', resource: 'users', action: 'manage', description: 'Manage system users' },
  { name: 'roles.manage', resource: 'roles', action: 'manage', description: 'Manage roles and permissions' },
  { name: 'permissions.manage', resource: 'permissions', action: 'manage', description: 'Manage raw permissions' },
  
  // Students
  { name: 'students.read', resource: 'students', action: 'read', description: 'View student list' },
  { name: 'students.create', resource: 'students', action: 'create', description: 'Add new students' },
  { name: 'students.manage', resource: 'students', action: 'manage', description: 'Full student management' },
  { name: 'students.fee_viewer', resource: 'students', action: 'fee_viewer', description: 'View student financial data' },
  
  // Teachers
  { name: 'teachers.read', resource: 'teachers', action: 'read', description: 'View teachers' },
  { name: 'teachers.manage', resource: 'teachers', action: 'manage', description: 'Manage teacher profiles' },
  
  // Academic
  { name: 'subjects.read', resource: 'subjects', action: 'read', description: 'View academic subjects' },
  { name: 'subjects.manage', resource: 'subjects', action: 'manage', description: 'Manage academic subjects' },
  { name: 'exams.read', resource: 'exams', action: 'read', description: 'View exam results' },
  { name: 'exams.manage', resource: 'exams', action: 'manage', description: 'Manage exam results' },
  { name: 'attendance.read', resource: 'attendance', action: 'read', description: 'View attendance records' },
  { name: 'attendance.manage', resource: 'attendance', action: 'manage', description: 'Record and edit attendance' },
  { name: 'memorization.read', resource: 'memorization', action: 'read', description: 'View memorization progress' },
  { name: 'memorization.manage', resource: 'memorization', action: 'manage', description: 'Record memorization sessions' },
  
  // Payments
  { name: 'payments.read', resource: 'payments', action: 'read', description: 'View payment records' },
  { name: 'payments.manage', resource: 'payments', action: 'manage', description: 'Manage payments and receipts' },
  
  // System
  { name: 'system.manage', resource: 'system', action: 'manage', description: 'Master administrator privilege' },
  { name: 'manage.system', resource: 'system', action: 'manage', description: 'Highest system-wide privilege' },
];

async function main() {
  console.log('--- STARTING MASTER SEED ---');

  // 1. Permissions
  console.log('Seeding permissions...');
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: p,
      create: p,
    });
  }

  const allPerms = await prisma.permission.findMany();
  console.log(`Seeded ${allPerms.length} permissions.`);

  // 2. Roles
  const rolesData = [
    { name: 'admin', description: 'Full system access', permNames: permissions.map(p => p.name) },
    { name: 'teacher', description: 'Teacher access', permNames: [
      'students.read', 'students.create', 'teachers.read', 'subjects.read', 'exams.read', 'exams.manage', 
      'attendance.read', 'attendance.manage', 'memorization.read', 'memorization.manage'
    ]},
    { name: 'parent', description: 'Parent access', permNames: [
      'students.read', 'attendance.read', 'memorization.read', 'exams.read', 'payments.read'
    ]},
    { name: 'viewer', description: 'Read-only access', permNames: permissions.filter(p => p.action === 'read').map(p => p.name) }
  ];

  console.log('Seeding roles...');
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description },
    });

    const rolePerms = allPerms.filter(p => r.permNames.includes(p.name));
    await prisma.role.update({
      where: { id: role.id },
      data: { permissions: { set: rolePerms.map(p => ({ id: p.id })) } }
    });
    console.log(`Role '${r.name}' updated with ${rolePerms.length} permissions.`);
  }

  // 3. Ensure internal role names are consistent (cleanup extra capitalized roles if they exist)
  const legacyRoles = await prisma.role.findMany({
    where: { name: { in: ['Admin', 'Teacher', 'Parent'] } }
  });
  if (legacyRoles.length > 0) {
    console.log(`Found ${legacyRoles.length} legacy (capitalized) roles. Cleaning up...`);
    // Before deleting, we should ideally reassign users, but for now we'll just delete them 
    // since the admin user will be reassigned to the lowercase role anyway.
    for (const lr of legacyRoles) {
      await prisma.role.delete({ where: { id: lr.id } }).catch(() => {});
    }
  }

  // 4. Admin User
  const adminUsername = 'admin';
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });

  if (adminRole) {
    await prisma.user.upsert({
      where: { username: adminUsername },
      update: { 
        roles: { connect: [{ id: adminRole.id }] }
      },
      create: {
        username: adminUsername,
        passwordHash: hashedPassword,
        name: 'System Admin',
        roles: { connect: [{ id: adminRole.id }] }
      }
    });
    console.log(`User 'admin' confirmed with 'admin' role.`);
  }

  console.log('--- MASTER SEED COMPLETE ---');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
