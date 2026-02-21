'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type Student = { id: string; name: string };
type TeacherUser = { id: string; username: string; name?: string | null };

const inputCls = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const selectCls = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const textareaCls = 'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

export function AddMemorizationForm({ onSuccess, onClose }: { onSuccess?: () => void; onClose?: () => void }) {
  const { data: session } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [studentId, setStudentId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [surahNumber, setSurahNumber] = useState('');
  const [ayahStart, setAyahStart] = useState('');
  const [ayahEnd, setAyahEnd] = useState('');
  const [memorizationType, setMemorizationType] = useState<'SABAQ' | 'MURAJAA'>('SABAQ');
  const [rating, setRating] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/students')
      .then((r) => r.json())
      .then((data) => setStudents(Array.isArray(data.students) ? data.students : []))
      .catch(() => setStudents([]));
    fetch('/api/users/teachers')
      .then((r) => r.json())
      .then((data) => setTeachers(Array.isArray(data) ? data : []))
      .catch(() => setTeachers([]));
  }, []);

  useEffect(() => {
    if (session?.user?.id && teachers.length > 0 && !teacherId) {
      const isTeacher = teachers.some((t) => t.id === session.user.id);
      if (isTeacher) setTeacherId(session.user.id);
    }
  }, [session?.user?.id, teachers, teacherId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !teacherId || !surahNumber || !ayahStart || !ayahEnd) return;
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
          setStudentId('');
          setTeacherId('');
          setSurahNumber('');
          setAyahStart('');
          setAyahEnd('');
          setRating('');
          setNotes('');
          setDate(new Date().toISOString().slice(0, 10));
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
    <div>
      <h3 className="font-semibold leading-none tracking-tight mb-4">Record memorization (Sabaq / Muraja&apos;a)</h3>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Student</label>
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required className={selectCls}>
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Teacher</label>
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            required
            disabled={!!(session?.user?.id && teachers.some((t) => t.id === session.user.id))}
            className={selectCls}
          >
            <option value="">Select teacher</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name || t.username}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Type</label>
          <select value={memorizationType} onChange={(e) => setMemorizationType(e.target.value as 'SABAQ' | 'MURAJAA')} className={selectCls}>
            <option value="SABAQ">Sabaq (new memorization)</option>
            <option value="MURAJAA">Muraja&apos;a (revision)</option>
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="date" className="text-sm font-medium leading-none">Date</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputCls} />
        </div>
        <div className="space-y-2">
          <label htmlFor="surah" className="text-sm font-medium leading-none">Surah (1–114)</label>
          <input id="surah" type="number" min={1} max={114} value={surahNumber} onChange={(e) => setSurahNumber(e.target.value)} required className={inputCls} />
        </div>
        <div className="space-y-2">
          <label htmlFor="ayahStart" className="text-sm font-medium leading-none">Ayah start</label>
          <input
            id="ayahStart"
            type="number"
            min={1}
            value={ayahStart}
            onChange={(ev) => { setAyahStart(ev.target.value); setErrors((prev) => ({ ...prev, ayahStart: '' })); }}
            required
            className={inputCls}
          />
          {errors.ayahStart && <p className="text-sm text-destructive">{errors.ayahStart}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="ayahEnd" className="text-sm font-medium leading-none">Ayah end</label>
          <input
            id="ayahEnd"
            type="number"
            min={1}
            value={ayahEnd}
            onChange={(ev) => { setAyahEnd(ev.target.value); setErrors((prev) => ({ ...prev, ayahEnd: '' })); }}
            required
            className={inputCls}
          />
          {errors.ayahEnd && <p className="text-sm text-destructive">{errors.ayahEnd}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="rating" className="text-sm font-medium leading-none">Rating (1–5)</label>
          <input id="rating" type="number" min={1} max={5} value={rating} onChange={(e) => setRating(e.target.value)} placeholder="Optional" className={inputCls} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="notes" className="text-sm font-medium leading-none">Teacher evaluation notes</label>
          <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" rows={2} className={textareaCls} />
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? 'Adding…' : 'Add record'}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
