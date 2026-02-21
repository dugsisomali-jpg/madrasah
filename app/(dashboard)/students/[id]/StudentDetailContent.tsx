'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, BookOpen, FileCheck } from 'lucide-react';
import { StudentProfile } from './StudentProfile';
import { StudentProgress } from './StudentProgress';
import { AddMemorizationForStudent } from './AddMemorizationForStudent';
import { AddExamForStudent } from './AddExamForStudent';
import { StudentExamsSection } from './StudentExamsSection';
import { StudentProfileEditModal } from './StudentProfileEditModal';

type Student = {
  id: string;
  name: string;
  motherName?: string | null;
  motherPhone?: string | null;
  dateOfBirth?: Date | string | null;
  address?: string | null;
  imagePath?: string | null;
  parent?: { id: string; username: string; name?: string | null } | null;
  teacherId?: string | null;
  teacher?: { id: string; username: string; name?: string | null } | null;
};

type Tab = 'memorization' | 'exams';

export function StudentDetailContent({ student }: { student: Student }) {
  const [activeTab, setActiveTab] = useState<Tab>('memorization');
  const [editOpen, setEditOpen] = useState(false);
  const [memorizationKey, setMemorizationKey] = useState(0);
  const [examsKey, setExamsKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/students"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex flex-1 items-start justify-between gap-4">
          <StudentProfile student={student} />
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <Pencil className="h-4 w-4" />
            Edit profile
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setActiveTab('memorization')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'memorization'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Memorization
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('exams')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'exams'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileCheck className="h-4 w-4" />
          Exams
        </button>
      </div>

      {activeTab === 'memorization' && (
        <div className="space-y-6">
          <AddMemorizationForStudent
            studentId={student.id}
            studentName={student.name}
            studentTeacherId={student.teacherId}
            onSuccess={() => setMemorizationKey((k) => k + 1)}
          />
          <StudentProgress key={memorizationKey} studentId={student.id} />
        </div>
      )}

      {activeTab === 'exams' && (
        <div className="space-y-6">
          <AddExamForStudent
            studentId={student.id}
            studentName={student.name}
            onSuccess={() => setExamsKey((k) => k + 1)}
          />
          <StudentExamsSection key={examsKey} studentId={student.id} />
        </div>
      )}

      {editOpen && (
        <StudentProfileEditModal
          student={student}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
