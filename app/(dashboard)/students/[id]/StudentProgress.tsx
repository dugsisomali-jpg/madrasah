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
  Teacher?: { name: string };
  teacher?: { name: string };
};

type Progress = {
  studentId: string;
  sabaqCount: number;
  murajaaCount: number;
  recentRecords: Record[];
};

export function StudentProgress({ studentId }: { studentId: string }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/memorization/student/${studentId}/progress`)
      .then((r) => r.json())
      .then(setProgress)
      .catch(() => setProgress(null))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
        </div>
        <TableSkeleton rows={6} cols={7} />
      </div>
    );
  }
  if (!progress) return <p className="text-muted-foreground">Failed to load progress.</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <p className="text-2xl font-bold">{progress.sabaqCount}</p>
          <p className="text-sm text-muted-foreground pt-2">Sabaq (new memorization)</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <p className="text-2xl font-bold">{progress.murajaaCount}</p>
          <p className="text-sm text-muted-foreground pt-2">Muraja&apos;a (revision)</p>
        </div>
      </div>
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <div className="flex flex-col space-y-1.5 mb-4">
          <h3 className="font-semibold leading-none tracking-tight">Recent memorization history</h3>
          <p className="text-sm text-muted-foreground">Daily tracking, teacher feedback, revision records</p>
        </div>
        {progress.recentRecords.length === 0 ? (
          <p className="py-4 text-muted-foreground">No records yet.</p>
        ) : (
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Surah</TableHead>
                  <TableHead className="whitespace-nowrap">Ayah</TableHead>
                  <TableHead className="whitespace-nowrap">Rating</TableHead>
                  <TableHead className="max-w-[200px]">Notes</TableHead>
                  <TableHead className="whitespace-nowrap">Teacher</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progress.recentRecords.map((r, i) => (
                  <TableRow key={r.id} className={i % 2 === 1 ? 'bg-muted/5' : ''}>
                    <TableCell className="whitespace-nowrap">{r.date?.slice(0, 10)}</TableCell>
                    <TableCell>{r.memorizationType}</TableCell>
                    <TableCell>{r.surahNumber}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.ayahStart}–{r.ayahEnd}</TableCell>
                    <TableCell>{r.rating ?? '—'}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground" title={r.notes ?? ''}>
                      {r.notes ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.Teacher?.name ?? r.teacher?.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>
    </div>
  );
}
