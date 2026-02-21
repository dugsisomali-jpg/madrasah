import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { StudentDetailContent } from './StudentDetailContent';

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, username: true, name: true } },
      teacher: { select: { id: true, username: true, name: true } },
    },
  });
  if (!student) notFound();

  const studentJson = {
    ...student,
    dateOfBirth: student.dateOfBirth?.toISOString?.() ?? student.dateOfBirth,
  };

  return <StudentDetailContent student={studentJson} />;
}
