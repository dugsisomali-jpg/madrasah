'use client';

import { useEffect, useState } from 'react';

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

const btnCls = 'inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';

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

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (records.length === 0) return <p className="text-muted-foreground">No memorization records yet.</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b transition-colors hover:bg-muted/50">
                <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Date</th>
                <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Student</th>
                <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Type</th>
                <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Surah</th>
                <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Ayah</th>
                <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Rating</th>
                <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Notes</th>
                <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Teacher</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle whitespace-nowrap">{r.date?.slice(0, 10)}</td>
                  <td className="p-4 align-middle">{r.Student?.name ?? r.student?.name}</td>
                  <td className="p-4 align-middle whitespace-nowrap">{r.memorizationType}</td>
                  <td className="p-4 align-middle">{r.surahNumber}</td>
                  <td className="p-4 align-middle whitespace-nowrap">{r.ayahStart}–{r.ayahEnd}</td>
                  <td className="p-4 align-middle">{r.rating ?? '—'}</td>
                  <td className="p-4 align-middle max-w-[150px] truncate" title={r.notes ?? ''}>{r.notes ?? '—'}</td>
                  <td className="p-4 align-middle">{r.Teacher?.name ?? r.teacher?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
