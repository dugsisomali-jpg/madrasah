'use client';

import { useState, useEffect } from 'react';

type Subject = { id: string; name: string };

const EXAM_TYPES = ['TERM_EXAM', 'MID_TERM', 'FINAL', 'QUIZ'] as const;

const inputCls =
  'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const selectCls =
  'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const btnPrimary =
  'inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50';

export function AddExamForStudent({
  studentId,
  studentName,
  onSuccess,
}: {
  studentId: string;
  studentName: string;
  onSuccess?: () => void;
}) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [examType, setExamType] = useState<string>('TERM_EXAM');
  const [term, setTerm] = useState('');
  const [marks, setMarks] = useState('');
  const [maxMarks, setMaxMarks] = useState('');
  const [report, setReport] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/subjects')
      .then((r) => r.json())
      .then((data) => setSubjects(Array.isArray(data) ? data : []))
      .catch(() => setSubjects([]));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !term || !marks || !maxMarks) return;
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
          setSubjectId('');
          setTerm('');
          setMarks('');
          setMaxMarks('');
          setReport('');
          setDate(new Date().toISOString().slice(0, 10));
          setExpanded(false);
          onSuccess?.();
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="rounded-xl border bg-card p-6">
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full rounded-lg border border-dashed border-primary/50 py-4 text-sm font-medium text-primary hover:bg-primary/5"
        >
          + Add exam result for {studentName}
        </button>
      ) : (
        <div>
          <h4 className="mb-4 font-semibold">Add exam result</h4>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
                className={selectCls}
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Exam type</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className={selectCls}
              >
                {EXAM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Term</label>
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="e.g. 2024-2025 Term 1"
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Marks</label>
              <input
                type="number"
                min={0}
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Max marks</label>
              <input
                type="number"
                min={0}
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">Report</label>
              <textarea
                value={report}
                onChange={(e) => setReport(e.target.value)}
                placeholder="Optional"
                rows={2}
                className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" disabled={loading} className={btnPrimary}>
                {loading ? 'Saving…' : 'Add exam result'}
              </button>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
