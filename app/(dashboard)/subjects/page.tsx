'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Pencil, Trash2, X } from 'lucide-react';
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

type Subject = {
  id: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
};

const inputCls =
  'flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50';
const selectCls =
  'flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50';
const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-input bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
const btnGhost =
  'inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const btnDanger =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-destructive px-5 py-2.5 text-sm font-medium text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Subject | null>(null);
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [description, setDescription] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  const loadSubjects = () => {
    setLoading(true);
    fetch('/api/subjects')
      .then((r) => r.json())
      .then((data) => setSubjects(Array.isArray(data) ? data : []))
      .catch(() => setSubjects([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setNameAr('');
    setDescription('');
    setError('');
    setModalOpen(true);
  };

  const openEdit = (s: Subject) => {
    setEditing(s);
    setName(s.name);
    setNameAr(s.nameAr ?? '');
    setDescription(s.description ?? '');
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setError('');
    setSubmitLoading(true);
    const body = {
      name: name.trim(),
      nameAr: nameAr.trim() || undefined,
      description: description.trim() || undefined,
    };
    const url = editing ? `/api/subjects/${editing.id}` : '/api/subjects';
    const method = editing ? 'PATCH' : 'POST';
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async (r) => {
        if (r.ok) {
          setModalOpen(false);
          setEditing(null);
          loadSubjects();
        } else {
          const data = await r.json().catch(() => ({}));
          setError(Array.isArray(data.error) ? data.error[0]?.message : data.error ?? 'Request failed');
        }
      })
      .finally(() => setSubmitLoading(false));
  };

  const handleDelete = (s: Subject) => {
    setSubmitLoading(true);
    fetch(`/api/subjects/${s.id}`, { method: 'DELETE' })
      .then(async (r) => {
        if (r.ok) {
          setDeleteConfirm(null);
          loadSubjects();
        } else {
          const data = await r.json().catch(() => ({}));
          setError(data.error ?? 'Delete failed');
        }
      })
      .finally(() => setSubmitLoading(false));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="size-6" />
            </span>
            Subjects
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Manage subjects for exams and grading.</p>
        </div>
        <button type="button" onClick={openCreate} className={btnPrimary}>
          <Plus className="size-4" />
          Create subject
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : subjects.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-6 rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 px-6 py-16 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-muted">
            <BookOpen className="size-10 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">No subjects yet</p>
            <p className="text-sm text-muted-foreground">Create your first subject to use in exams.</p>
          </div>
          <button type="button" onClick={openCreate} className={btnPrimary}>
            <Plus className="size-4" />
            Create subject
          </button>
        </div>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Arabic name (optional)</TableHead>
                <TableHead className="max-w-[200px]">Description</TableHead>
                <TableHead className="w-24 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((s, i) => (
                <TableRow key={s.id} className={i % 2 === 1 ? 'bg-muted/5' : ''}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell dir="rtl">{s.nameAr?.trim() || '—'}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {s.description?.trim() || '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        className={btnGhost}
                        title="Edit"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(s)}
                        className={`${btnGhost} hover:bg-destructive/10 hover:text-destructive`}
                        title="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create / Edit modal */}
      {modalOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => !submitLoading && setModalOpen(false)}
            aria-hidden
          />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal
            aria-labelledby="subject-modal-title"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 id="subject-modal-title" className="text-xl font-semibold">
                {editing ? 'Edit subject' : 'Create subject'}
              </h2>
              <button
                type="button"
                onClick={() => !submitLoading && setModalOpen(false)}
                className={btnGhost}
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={inputCls}
                    placeholder="e.g. Qur'an Memorization"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Arabic name (optional)</label>
                  <input
                    type="text"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    className={inputCls}
                    placeholder="مثال: حفظ القرآن"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="min-h-[80px] w-full resize-y rounded-xl border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Optional description"
                />
              </div>
              {error && (
                <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
              )}
              <div className="flex flex-wrap gap-3 pt-2">
                <button type="submit" disabled={submitLoading} className={btnPrimary}>
                  {submitLoading ? 'Loading…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => !submitLoading && setModalOpen(false)}
                  className={btnSecondary}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => !submitLoading && setDeleteConfirm(null)}
            aria-hidden
          />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl"
            role="alertdialog"
            aria-modal
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title" className="text-lg font-semibold text-foreground">
              Delete: {deleteConfirm.name}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Delete this subject? Exam results linked to it will keep the subject name but the subject will be removed from the list.</p>
            {error && (
              <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={submitLoading}
                className={btnDanger}
              >
                {submitLoading ? 'Loading…' : 'Delete'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirm(null);
                  setError('');
                }}
                disabled={submitLoading}
                className={btnSecondary}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
