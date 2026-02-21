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

type Record = {
  id: string;
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
  memorizationType: string;
  rating?: number;
  notes?: string;
  date: string;
  Student?: { name: string };
  Teacher?: { name: string };
  student?: { name: string };
  teacher?: { name: string };
};

const btnCls =
  'inline-flex h-9 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';

function TypeBadge({ type }: { type: string }) {
  const isSabaq = type === 'SABAQ';
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium ${
        isSabaq
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
          : 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300'
      }`}
    >
      {isSabaq ? 'Sabaq' : 'Muraja\'a'}
    </span>
  );
}

export function MemorizationList() {
  const [records, setRecords] = useState<Record[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/memorization?page=${page}&limit=20`)
      .then((r) => r.json())
      .then((data) => {
        setRecords(data.data ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
      })
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) {
    return (
      <div className="space-y-4">
        <TableSkeleton rows={8} cols={8} className="border-teal-200/50 dark:border-teal-800/30" />
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-9 w-24 animate-pulse rounded-xl bg-muted" />
          <span className="text-sm text-muted-foreground">Page 1 of 1</span>
          <div className="h-9 w-16 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-teal-200/60 bg-teal-50/30 py-16 dark:border-teal-800/40 dark:bg-teal-950/20">
        <p className="text-sm text-muted-foreground">No memorization records yet.</p>
        <p className="text-xs text-muted-foreground">Add a record to track Sabaq or Muraja&apos;a.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TableContainer className="border-teal-200/50 dark:border-teal-800/30">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-teal-200/50 dark:border-teal-800/30">
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="whitespace-nowrap">Student</TableHead>
                <TableHead className="whitespace-nowrap">Type</TableHead>
                <TableHead className="whitespace-nowrap">Surah</TableHead>
                <TableHead className="whitespace-nowrap">Ayah</TableHead>
                <TableHead className="whitespace-nowrap">Rating</TableHead>
                <TableHead className="max-w-[150px]">Notes</TableHead>
                <TableHead className="whitespace-nowrap">Teacher</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r, i) => (
                <TableRow
                  key={r.id}
                  className={`border-teal-100/50 dark:border-teal-900/20 ${i % 2 === 1 ? 'bg-teal-50/30 dark:bg-teal-950/10' : ''}`}
                >
                  <TableCell className="whitespace-nowrap font-medium">{r.date?.slice(0, 10)}</TableCell>
                  <TableCell>{r.Student?.name ?? r.student?.name}</TableCell>
                  <TableCell>
                    <TypeBadge type={r.memorizationType} />
                  </TableCell>
                  <TableCell>{r.surahNumber}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.ayahStart}–{r.ayahEnd}</TableCell>
                  <TableCell>{r.rating ?? '—'}</TableCell>
                  <TableCell className="max-w-[150px] truncate text-muted-foreground" title={r.notes ?? ''}>
                    {r.notes ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.Teacher?.name ?? r.teacher?.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </TableContainer>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className={btnCls}
        >
          Previous
        </button>
        <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className={btnCls}
        >
          Next
        </button>
      </div>
    </div>
  );
}
