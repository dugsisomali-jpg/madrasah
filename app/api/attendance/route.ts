import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AttendanceStatus } from '@prisma/client';
import { hasPermission, shouldFilterMemorizationByTeacher, isParentRole } from '@/lib/auth-utils';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date');
  const studentId = searchParams.get('studentId');

  try {
    const isTeacher = await shouldFilterMemorizationByTeacher(session.user.id);
    const isParent = await isParentRole(session.user.id);
    const canReadGlobal = await hasPermission(session.user.id, 'attendance.read');

    let where: any = {};

    if (studentId) {
      // If fetching for a specific student, check permission
      if (!canReadGlobal) {
        if (isParent) {
          // Verify this is the parent's child
          const student = await prisma.student.findUnique({
            where: { id: studentId, parentId: session.user.id }
          });
          if (!student) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        } else if (isTeacher) {
          // Verify this is the teacher's student
          const student = await prisma.student.findUnique({
            where: { id: studentId, teacherId: session.user.id }
          });
          if (!student) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        } else {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
      where.studentId = studentId;
      if (dateStr) where.date = new Date(dateStr);
    } else {
      // General view (requires global read or teacher role)
      if (!canReadGlobal && !isTeacher) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      if (!dateStr) return NextResponse.json({ error: 'Date is required' }, { status: 400 });
      where.date = new Date(dateStr);

      if (isTeacher && !canReadGlobal) {
        where.Student = { teacherId: session.user.id };
      }
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        Student: {
          select: {
            name: true,
            teacherId: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Attendance GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const canManage = await hasPermission(session.user.id, 'attendance.manage');
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const { date: dateStr, records } = body;

    if (!dateStr || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const date = new Date(dateStr);

    const isTeacher = await shouldFilterMemorizationByTeacher(session.user.id);

    // If teacher, verify they teach all these students
    if (isTeacher) {
      const studentIds = records.map((r: any) => r.studentId);
      const invalidStudents = await prisma.student.findMany({
        where: {
          id: { in: studentIds },
          teacherId: { not: session.user.id }
        },
        select: { id: true }
      });

      if (invalidStudents.length > 0) {
        return NextResponse.json({ 
          error: 'Forbidden: You can only record attendance for your own students' 
        }, { status: 403 });
      }
    }

    // Bulk upsert logic
    const operations = records.map((record: any) => 
      prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: record.studentId,
            date: date,
          },
        },
        update: {
          status: record.status as AttendanceStatus,
          notes: record.notes || null,
        },
        create: {
          studentId: record.studentId,
          date: date,
          status: record.status as AttendanceStatus,
          notes: record.notes || null,
        },
      })
    );

    await prisma.$transaction(operations);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Attendance Error:', error);
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
  }
}
