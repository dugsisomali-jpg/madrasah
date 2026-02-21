'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';

type Student = { id: string; name: string };
type Subject = { id: string; name: string; nameAr?: string | null };

const EXAM_TYPES = ['TERM_EXAM', 'MID_TERM', 'FINAL', 'QUIZ'] as const;

const inputCls = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const selectCls = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const textareaCls = 'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

export function AddExamForm({ onSuccess, onCancel }: { onSuccess?: () => void; onCancel?: () => void }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studentId, setStudentId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [examType, setExamType] = useState<string>('TERM_EXAM');
  const [term, setTerm] = useState('');
  const [marks, setMarks] = useState('');
  const [maxMarks, setMaxMarks] = useState('');
  const [report, setReport] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/students?perPage=500')
      .then((r) => r.json())
      .then((data) => setStudents(Array.isArray(data?.students) ? data.students : []))
      .catch(() => setStudents([]));
    fetch('/api/subjects')
      .then((r) => r.json())
      .then((data) => setSubjects(Array.isArray(data) ? data : []))
      .catch(() => setSubjects([]));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !subjectId || !term || !marks || !maxMarks) return;
    setLoading(true);
    fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        subjectId,
        examType,
        term,
        marks: Number(marks),
        maxMarks: Number(maxMarks),
        report: report || undefined,
        date,
      }),
    })
      .then((r) => {
        if (r.ok) {
          setStudentId('');
          setSubjectId('');
          setTerm('');
          setMarks('');
          setMaxMarks('');
          setReport('');
          setDate(new Date().toISOString().slice(0, 10));
          onSuccess?.();
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <h2 className="text-lg font-semibold">Add exam result</h2>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Student</label>
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required className={selectCls}>
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Subject</label>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required className={selectCls}>
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {locale === 'ar' && s.nameAr?.trim() ? s.nameAr.trim() : s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Exam type</label>
          <select value={examType} onChange={(e) => setExamType(e.target.value)} className={selectCls}>
            {EXAM_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="date" className="text-sm font-medium leading-none">Date</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputCls} />
        </div>
        <div className="space-y-2">
          <label htmlFor="term" className="text-sm font-medium leading-none">Term</label>
          <input id="term" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="e.g. 2024-2025 Term 1" required className={inputCls} />
        </div>
        <div className="space-y-2">
          <label htmlFor="marks" className="text-sm font-medium leading-none">Marks</label>
          <input id="marks" type="number" min={0} value={marks} onChange={(e) => setMarks(e.target.value)} required className={inputCls} />
        </div>
        <div className="space-y-2">
          <label htmlFor="maxMarks" className="text-sm font-medium leading-none">Max marks</label>
          <input id="maxMarks" type="number" min={0} value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} required className={inputCls} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="report" className="text-sm font-medium leading-none">Report</label>
          <textarea id="report" value={report} onChange={(e) => setReport(e.target.value)} placeholder="Optional" rows={2} className={textareaCls} />
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Add exam result'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
