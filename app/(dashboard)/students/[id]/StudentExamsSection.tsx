'use client';

import { useEffect, useState } from 'react';

type ExamResult = {
  id: string;
  examType: string;
  term: string;
  marks: number;
  maxMarks: number;
  report?: string | null;
  date: string;
  Subject?: { name: string };
};

export function StudentExamsSection({ studentId }: { studentId: string }) {
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`/api/exams?studentId=${studentId}`)
      .then((r) => r.json())
      .then((data) => setExams(Array.isArray(data) ? data : []))
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [studentId]);

  if (loading) return <p className="text-muted-foreground">Loading exams…</p>;

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="mb-4 font-semibold">Exam results</h3>
      {exams.length === 0 ? (
        <p className="text-muted-foreground">No exam results yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="h-10 px-4 text-left font-medium">Date</th>
                <th className="h-10 px-4 text-left font-medium">Subject</th>
                <th className="h-10 px-4 text-left font-medium">Type</th>
                <th className="h-10 px-4 text-left font-medium">Term</th>
                <th className="h-10 px-4 text-left font-medium">Marks</th>
                <th className="h-10 px-4 text-left font-medium">Report</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((e) => (
                <tr key={e.id} className="border-b hover:bg-muted/50">
                  <td className="p-4">{e.date?.slice(0, 10)}</td>
                  <td className="p-4">{e.Subject?.name ?? '—'}</td>
                  <td className="p-4">{e.examType?.replace(/_/g, ' ')}</td>
                  <td className="p-4">{e.term}</td>
                  <td className="p-4">
                    {e.marks} / {e.maxMarks}
                  </td>
                  <td className="max-w-[200px] truncate p-4" title={e.report ?? ''}>
                    {e.report ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
