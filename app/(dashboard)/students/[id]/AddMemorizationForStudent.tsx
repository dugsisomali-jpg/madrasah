'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type TeacherUser = { id: string; username: string; name?: string | null };

const inputCls =
  'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const selectCls =
  'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const btnPrimary =
  'inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50';

export function AddMemorizationForStudent({
  studentId,
  studentName,
  studentTeacherId,
  onSuccess,
}: {
  studentId: string;
  studentName: string;
  studentTeacherId?: string | null;
  onSuccess?: () => void;
}) {
  const { data: session } = useSession();
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [teacherId, setTeacherId] = useState(studentTeacherId ?? '');
  const [surahNumber, setSurahNumber] = useState('');
  const [ayahStart, setAyahStart] = useState('');
  const [ayahEnd, setAyahEnd] = useState('');
  const [memorizationType, setMemorizationType] = useState<'SABAQ' | 'MURAJAA'>('SABAQ');
  const [rating, setRating] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/users/teachers')
      .then((r) => r.json())
      .then((data) => setTeachers(Array.isArray(data) ? data : []))
      .catch(() => setTeachers([]));
  }, []);

  useEffect(() => {
    if (session?.user?.id && teachers.length > 0) {
      const isTeacher = teachers.some((t) => t.id === session.user.id);
      if (isTeacher) setTeacherId(session.user.id);
    }
  }, [session?.user?.id, teachers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !surahNumber || !ayahStart || !ayahEnd) return;
    setLoading(true);
    setErrors({});
    fetch('/api/memorization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        teacherId,
        surahNumber: Number(surahNumber),
        ayahStart: Number(ayahStart),
        ayahEnd: Number(ayahEnd),
        memorizationType,
        rating: rating ? Number(rating) : undefined,
        notes: notes || undefined,
        date,
      }),
    })
      .then(async (r) => {
        if (r.ok) {
          setTeacherId('');
          setSurahNumber('');
          setAyahStart('');
          setAyahEnd('');
          setRating('');
          setNotes('');
          setDate(new Date().toISOString().slice(0, 10));
          setExpanded(false);
          setErrors({});
          onSuccess?.();
        } else if (r.status === 400) {
          const data = await r.json();
          const fieldErrors: Record<string, string> = {};
          if (Array.isArray(data.error)) {
            for (const err of data.error) {
              const path = err.path?.[0] ?? err.path;
              if (path && err.message) fieldErrors[path] = err.message;
            }
          }
          setErrors(fieldErrors);
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
          + Add memorization for {studentName}
        </button>
      ) : (
        <div>
          <h4 className="mb-4 font-semibold">Record memorization</h4>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Teacher</label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                required
                disabled={!!(session?.user?.id && teachers.some((t) => t.id === session.user.id))}
                className={selectCls}
              >
                <option value="">Select teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name || t.username}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Type</label>
              <select
                value={memorizationType}
                onChange={(e) => setMemorizationType(e.target.value as 'SABAQ' | 'MURAJAA')}
                className={selectCls}
              >
                <option value="SABAQ">Sabaq (new)</option>
                <option value="MURAJAA">Murajaa (revision)</option>
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
              <label className="mb-1.5 block text-sm font-medium">Surah (1–114)</label>
              <input
                type="number"
                min={1}
                max={114}
                value={surahNumber}
                onChange={(e) => setSurahNumber(e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Ayah start</label>
              <input
                type="number"
                min={1}
                value={ayahStart}
                onChange={(ev) => { setAyahStart(ev.target.value); setErrors((prev) => ({ ...prev, ayahStart: '' })); }}
                required
                className={inputCls}
              />
              {errors.ayahStart && <p className="mt-1 text-sm text-destructive">{errors.ayahStart}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Ayah end</label>
              <input
                type="number"
                min={1}
                value={ayahEnd}
                onChange={(ev) => { setAyahEnd(ev.target.value); setErrors((prev) => ({ ...prev, ayahEnd: '' })); }}
                required
                className={inputCls}
              />
              {errors.ayahEnd && <p className="mt-1 text-sm text-destructive">{errors.ayahEnd}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Rating (1–5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="Optional"
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
                rows={2}
                className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" disabled={loading} className={btnPrimary}>
                {loading ? 'Saving…' : 'Add record'}
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
