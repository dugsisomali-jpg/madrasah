'use client';

import { useState, useEffect } from 'react';

type Student = { id: string; name: string };
type Subject = { id: string; name: string };

const EXAM_TYPES = ['TERM_EXAM', 'MID_TERM', 'FINAL', 'QUIZ'] as const;

const inputCls =
  'flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2';
const selectCls =
  'flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2';
const textareaCls =
  'flex min-h-[80px] w-full rounded-xl border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50';

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
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject first */}
        <div className="rounded-xl border border-indigo-200/50 bg-indigo-50/40 p-4 dark:border-indigo-800/30 dark:bg-indigo-950/20">
          <p className="mb-3 text-sm font-medium text-indigo-800 dark:text-indigo-200">Subject &amp; student</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Subject</label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required className={selectCls}>
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Student</label>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required className={selectCls}>
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Exam type</label>
            <select value={examType} onChange={(e) => setExamType(e.target.value)} className={selectCls}>
              {EXAM_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium text-foreground">Date</label>
            <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputCls} />
          </div>
          <div className="space-y-2">
            <label htmlFor="term" className="text-sm font-medium text-foreground">Term</label>
            <input id="term" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="e.g. 2024-2025 Term 1" required className={inputCls} />
          </div>
          <div className="space-y-2">
            <label htmlFor="marks" className="text-sm font-medium text-foreground">Marks</label>
            <input id="marks" type="number" min={0} value={marks} onChange={(e) => setMarks(e.target.value)} required className={inputCls} />
          </div>
          <div className="space-y-2">
            <label htmlFor="maxMarks" className="text-sm font-medium text-foreground">Max marks</label>
            <input id="maxMarks" type="number" min={0} value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} required className={inputCls} />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="report" className="text-sm font-medium text-foreground">Report</label>
          <textarea id="report" value={report} onChange={(e) => setReport(e.target.value)} placeholder="Optional" rows={2} className={textareaCls} />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            {loading ? 'Saving…' : 'Add exam result'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-input bg-background px-5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
