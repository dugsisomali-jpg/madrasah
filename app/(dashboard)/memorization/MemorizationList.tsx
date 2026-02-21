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
        <TableSkeleton rows={8} cols={8} />
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
      <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-muted-foreground/25 bg-muted/20">
        <p className="text-sm text-muted-foreground">No memorization records yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
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
              <TableRow key={r.id} className={i % 2 === 1 ? 'bg-muted/5' : ''}>
                <TableCell className="whitespace-nowrap font-medium">{r.date?.slice(0, 10)}</TableCell>
                <TableCell>{r.Student?.name ?? r.student?.name}</TableCell>
                <TableCell className="whitespace-nowrap">{r.memorizationType}</TableCell>
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
