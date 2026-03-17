import { prisma } from '@/lib/prisma';
import { AttendanceContent } from './AttendanceContent';

export default async function AttendancePage() {
  const students = await prisma.student.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      teacherId: true,
      teacher: { select: { name: true, username: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold sm:text-3xl">Attendance</h1>
      </div>
      <AttendanceContent initialStudents={students as any} />
    </div>
  );
}
