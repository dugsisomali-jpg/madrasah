import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { isParentRole } from '@/lib/auth-utils';

async function getStats() {
  try {
    const [students, teachersCount, memorization] = await Promise.all([
      prisma.student.count(),
      prisma.user.count({ where: { roles: { some: { name: { equals: 'teacher', mode: 'insensitive' } } } } }),
      prisma.memorization_records.count(),
    ]);
    return { students, teachers: teachersCount, memorization };
  } catch {
    return { students: 0, teachers: 0, memorization: 0 };
  }
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id && (await isParentRole(session.user.id))) {
    redirect('/parent');
  }

  const stats = await getStats();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold sm:text-3xl">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="pb-2">
            <p className="text-3xl font-bold sm:text-4xl">{stats.students}</p>
            <p className="text-sm text-muted-foreground pt-2">Students</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="pb-2">
            <p className="text-3xl font-bold sm:text-4xl">{stats.teachers}</p>
            <p className="text-sm text-muted-foreground pt-2">Teachers</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="pb-2">
            <p className="text-3xl font-bold sm:text-4xl">{stats.memorization}</p>
            <p className="text-sm text-muted-foreground pt-2">Memorization Records</p>
          </div>
        </div>
      </div>
    </div>
  );
}
