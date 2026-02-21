'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
} from '@/components/ui/table';

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

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="mb-4 font-semibold">Exam results</h3>
      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : exams.length === 0 ? (
        <p className="py-6 text-muted-foreground">No exam results yet.</p>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="whitespace-nowrap">Subject</TableHead>
                <TableHead className="whitespace-nowrap">Type</TableHead>
                <TableHead className="whitespace-nowrap">Term</TableHead>
                <TableHead className="whitespace-nowrap">Marks</TableHead>
                <TableHead className="max-w-[200px]">Report</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((e, i) => (
                <TableRow key={e.id} className={i % 2 === 1 ? 'bg-muted/5' : ''}>
                  <TableCell className="whitespace-nowrap">{e.date?.slice(0, 10)}</TableCell>
                  <TableCell>{e.Subject?.name ?? '—'}</TableCell>
                  <TableCell>{e.examType?.replace(/_/g, ' ')}</TableCell>
                  <TableCell>{e.term}</TableCell>
                  <TableCell className="whitespace-nowrap">{e.marks} / {e.maxMarks}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground" title={e.report ?? ''}>
                    {e.report ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
