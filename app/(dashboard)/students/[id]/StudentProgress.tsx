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

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
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
          <p className="text-muted-foreground py-4">No records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-10 px-4 text-left align-middle font-medium">Date</th>
                  <th className="h-10 px-4 text-left align-middle font-medium">Type</th>
                  <th className="h-10 px-4 text-left align-middle font-medium">Surah</th>
                  <th className="h-10 px-4 text-left align-middle font-medium">Ayah</th>
                  <th className="h-10 px-4 text-left align-middle font-medium">Rating</th>
                  <th className="h-10 px-4 text-left align-middle font-medium">Notes</th>
                  <th className="h-10 px-4 text-left align-middle font-medium">Teacher</th>
                </tr>
              </thead>
              <tbody>
                {progress.recentRecords.map((r) => (
                  <tr key={r.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">{r.date?.slice(0, 10)}</td>
                    <td className="p-4 align-middle">{r.memorizationType}</td>
                    <td className="p-4 align-middle">{r.surahNumber}</td>
                    <td className="p-4 align-middle">{r.ayahStart}–{r.ayahEnd}</td>
                    <td className="p-4 align-middle">{r.rating ?? '—'}</td>
                    <td className="p-4 align-middle max-w-[200px] truncate" title={r.notes ?? ''}>{r.notes ?? '—'}</td>
                    <td className="p-4 align-middle">{r.Teacher?.name ?? r.teacher?.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
