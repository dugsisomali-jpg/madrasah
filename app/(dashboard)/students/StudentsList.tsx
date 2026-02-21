'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Image, ImageKitProvider, upload } from '@imagekit/next';
import {
  UserPlus,
  Camera,
  User,
  Search,
  Filter,
  Pencil,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Calendar,
} from 'lucide-react';

type ParentUser = { id: string; username: string; name?: string | null; roles?: { name: string }[] };
type TeacherUser = { id: string; username: string; name?: string | null };
type Student = {
  id: string;
  name: string;
  motherName?: string | null;
  motherPhone?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  imagePath?: string | null;
  fee?: number | string | null;
  parent?: ParentUser | null;
  teacherId?: string | null;
  teacher?: TeacherUser | null;
};

const inputCls =
  'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';
const btnPrimary = `${btnBase} bg-primary text-primary-foreground shadow-sm hover:bg-primary/90`;
const btnSecondary = `${btnBase} border border-input bg-background hover:bg-accent hover:text-accent-foreground`;

function StudentCardSkeleton() {
  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-card p-0 shadow-sm">
      <div className="w-24 shrink-0 animate-pulse bg-muted sm:w-28" />
      <div className="flex flex-1 flex-col justify-between gap-3 p-5">
        <div>
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-3 w-full animate-pulse rounded bg-muted" />
          <div className="mt-1 h-3 w-[75%] animate-pulse rounded bg-muted" />
        </div>
        <div className="flex justify-between">
          <div className="h-8 w-8 animate-pulse rounded bg-muted" />
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

function StudentAvatar({
  imagePath,
  name,
  size = 'md',
  className,
}: {
  imagePath?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'fill';
  className?: string;
}) {
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  const dim =
    size === 'sm'
      ? 'h-10 w-10'
      : size === 'lg'
        ? 'h-16 w-16'
        : size === 'fill'
          ? 'h-full w-full min-h-0 min-w-0'
          : 'h-12 w-12';
  const iconDim = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
  const rounded = size === 'fill' ? 'rounded-l-xl' : 'rounded-full';
  if (!imagePath || !urlEndpoint) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center bg-muted ${dim} ${rounded} ${className ?? ''}`}
      >
        <User className={`${size === 'fill' ? 'h-12 w-12' : iconDim} text-muted-foreground`} />
      </div>
    );
  }
  const src = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  const sizePx = size === 'sm' ? 40 : size === 'lg' ? 64 : size === 'fill' ? 256 : 48;
  return (
    <Image
      src={src}
      width={sizePx}
      height={sizePx}
      transformation={[{ height: '256', width: '256', crop: 'at_max' }]}
      responsive={false}
      alt={name}
      className={`shrink-0 object-cover object-center ${dim} ${rounded} ${className ?? ''}`}
    />
  );
}

function StudentCard({
  student: s,
  onEdit,
  canViewFee,
  canEdit,
}: {
  student: Student;
  onEdit: (s: Student) => void;
  canViewFee?: boolean;
  canEdit?: boolean;
}) {
  return (
    <div className="group relative flex items-stretch overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:border-border/80">
      <div className="flex w-[28%] min-w-0 shrink-0 self-stretch overflow-hidden rounded-l-xl bg-muted">
        <StudentAvatar imagePath={s.imagePath} name={s.name} size="fill" />
      </div>
      <div className="min-w-0 flex-1 flex flex-col justify-between p-5">
        <div>
          <h3 className="font-semibold text-foreground">{s.name}</h3>
          {s.motherName && (
            <p className="text-sm text-muted-foreground">{s.motherName}</p>
          )}
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">Student</span>
          </div>
          {s.dateOfBirth && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {String(s.dateOfBirth).slice(0, 10)}
            </p>
          )}
          {s.address && (
            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {s.address}
            </p>
          )}
          {s.motherPhone && (
            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {s.motherPhone}
            </p>
          )}
          {canViewFee && s.fee != null && (
            <p className="mt-1 text-xs text-muted-foreground">Fee: {typeof s.fee === 'number' ? s.fee : String(s.fee)}</p>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(s)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          <Link
            href={`/students/${s.id}`}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <ChevronRight className="h-3.5 w-3.5" />
            View progress
          </Link>
        </div>
      </div>
    </div>
  );
}

function StudentsListInner() {
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<ParentUser[]>([]);
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [canViewFee, setCanViewFee] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [parentSearch, setParentSearch] = useState('');
  const [parentDropdownOpen, setParentDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [filterParentId, setFilterParentId] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    motherName: '',
    motherPhone: '',
    dateOfBirth: '',
    parentId: '',
    teacherId: '',
    address: '',
    imagePath: '',
    fee: '',
  });

  const load = useCallback(() => {
    setStudentsLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('perPage', String(perPage));
    if (searchDebounced) params.set('q', searchDebounced);
    if (filterParentId) params.set('parentId', filterParentId);
    if (filterDateFrom) params.set('dateOfBirthFrom', filterDateFrom);
    if (filterDateTo) params.set('dateOfBirthTo', filterDateTo);
    fetch(`/api/students?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.students) {
          setStudents(data.students);
          setTotal(data.total ?? 0);
          setTotalPages(data.totalPages ?? 1);
        } else {
          setStudents([]);
        }
      })
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false));
  }, [page, perPage, searchDebounced, filterParentId, filterDateFrom, filterDateTo]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const loadParents = (q = '') => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((users: ParentUser[]) => {
        const parentUsers = Array.isArray(users)
          ? users.filter((u) => u.roles?.some((r) => (r.name || '').toLowerCase() === 'parent'))
          : [];
        const search = q.trim().toLowerCase();
        const filtered =
          search === ''
            ? parentUsers
            : parentUsers.filter(
                (u) =>
                  (u.username || '').toLowerCase().includes(search) ||
                  (u.name || '').toLowerCase().includes(search)
              );
        setParents(filtered);
      })
      .catch(() => setParents([]));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadParents(parentSearch);
  }, [parentSearch]);

  useEffect(() => {
    fetch('/api/users/teachers')
      .then((r) => r.json())
      .then((data) => setTeachers(Array.isArray(data) ? data : []))
      .catch(() => setTeachers([]));
  }, []);

  useEffect(() => {
    fetch('/api/auth/permissions')
      .then((r) => r.json())
      .then((data) => {
        const perms = Array.isArray(data.permissions) ? data.permissions : [];
        setCanViewFee(perms.includes('students.fee_viewer'));
        setCanCreate(perms.includes('students.create') || perms.includes('students.manage'));
      })
      .catch(() => {
        setCanViewFee(false);
        setCanCreate(false);
      });
  }, []);

  const resetForm = () => {
    setForm({
      name: '',
      motherName: '',
      motherPhone: '',
      dateOfBirth: '',
      parentId: '',
      teacherId: '',
      address: '',
      imagePath: '',
      fee: '',
    });
    setParentSearch('');
    setEditStudent(null);
    setAddOpen(false);
  };

  const openAdd = () => {
    resetForm();
    setAddOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditStudent(s);
    setForm({
      name: s.name,
      motherName: s.motherName ?? '',
      motherPhone: s.motherPhone ?? '',
      dateOfBirth: s.dateOfBirth ? String(s.dateOfBirth).slice(0, 10) : '',
      parentId: s.parent?.id ?? '',
      teacherId: s.teacherId ?? s.teacher?.id ?? '',
      address: s.address ?? '',
      imagePath: s.imagePath ?? '',
      fee: s.fee != null ? String(s.fee) : '',
    });
    setParentSearch(s.parent ? (s.parent.name || s.parent.username) : '');
  };

  const fetchAuth = async () => {
    const r = await fetch('/api/imagekit/auth');
    if (!r.ok) throw new Error('Failed to get upload auth');
    return r.json();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const auth = await fetchAuth();
      const result = await upload({
        file,
        fileName: `student-${Date.now()}-${file.name}`,
        folder: '/students',
        token: auth.token,
        expire: auth.expire,
        signature: auth.signature,
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
        useUniqueFileName: true,
      });
      setForm((f) => ({ ...f, imagePath: result.filePath ?? f.imagePath }));
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        dateOfBirth: form.dateOfBirth || undefined,
        parentId: form.parentId || null,
        teacherId: form.teacherId || null,
        fee: form.fee ? Number(form.fee) : undefined,
      }),
    })
      .then(() => {
        resetForm();
        load();
      })
      .finally(() => setLoading(false));
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent || !form.name.trim()) return;
    setLoading(true);
    fetch(`/api/students/${editStudent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        dateOfBirth: form.dateOfBirth || undefined,
        parentId: form.parentId || null,
        teacherId: form.teacherId || null,
        imagePath: form.imagePath || null,
        fee: form.fee ? Number(form.fee) : null,
      }),
    })
      .then(() => {
        resetForm();
        load();
      })
      .finally(() => setLoading(false));
  };

  const selectParent = (p: ParentUser) => {
    setForm((f) => ({ ...f, parentId: p.id }));
    setParentSearch(p.name || p.username);
    setParentDropdownOpen(false);
  };

  const renderForm = (onSubmit: (e: React.FormEvent) => void, title: string, showFee = canViewFee) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Photo</label>
          <div className="flex items-center gap-4">
            <StudentAvatar imagePath={form.imagePath} name={form.name || 'Student'} />
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={btnSecondary + ' text-xs h-8'}
              >
                <Camera className="h-4 w-4" />
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Mother name</label>
            <input
              value={form.motherName}
              onChange={(e) => setForm((f) => ({ ...f, motherName: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Mother phone</label>
            <input
              value={form.motherPhone}
              onChange={(e) => setForm((f) => ({ ...f, motherPhone: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div className="relative">
            <label className="mb-1.5 block text-sm font-medium">Parent (user)</label>
            <input
              value={parentSearch}
              onChange={(e) => {
                setParentSearch(e.target.value);
                setParentDropdownOpen(true);
              }}
              onFocus={() => setParentDropdownOpen(true)}
              onBlur={() => setTimeout(() => setParentDropdownOpen(false), 200)}
              placeholder="Search by username or name..."
              className={inputCls}
            />
            {parentDropdownOpen && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-background shadow-lg">
                {parents.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">No parents found</p>
                ) : (
                  parents.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectParent(p);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-muted cursor-pointer ${form.parentId === p.id ? 'bg-muted' : ''}`}
                    >
                      {p.name || p.username} ({p.username})
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Teacher</label>
            <select
              value={form.teacherId}
              onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
              className={inputCls}
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
            <label className="mb-1.5 block text-sm font-medium">Date of birth</label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
              className={inputCls}
            />
          </div>
          {showFee && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Fee</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.fee}
                onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))}
                placeholder="0"
                className={inputCls}
              />
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className={inputCls}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={resetForm} className={btnSecondary}>
          Cancel
        </button>
        <button type="submit" disabled={loading || uploading} className={btnPrimary}>
          {uploading ? 'Uploading…' : loading ? 'Saving…' : title}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header & filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, mother, parent, address..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className={`${inputCls} w-full pl-9`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                filtersOpen || filterParentId || filterDateFrom || filterDateTo
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-input bg-background hover:bg-muted'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {(filterParentId || filterDateFrom || filterDateTo) && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 px-1.5 text-xs">
                  {[filterParentId, filterDateFrom, filterDateTo].filter(Boolean).length}
                </span>
              )}
              {filtersOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:inline">Per page</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className={`${inputCls} w-16 sm:w-20`}
                title="Items per page"
              >
                {[6, 12, 24, 48].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            {canCreate && (
              <button type="button" onClick={openAdd} className={btnPrimary}>
                <UserPlus className="h-4 w-4" />
                Add student
              </button>
            )}
          </div>
        </div>

        {filtersOpen && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Filter by
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Parent</label>
                <select
                  value={filterParentId}
                  onChange={(e) => {
                    setFilterParentId(e.target.value);
                    setPage(1);
                  }}
                  className={inputCls}
                >
                  <option value="">All parents</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.username}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Date of birth (from)</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => {
                    setFilterDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Date of birth (to)</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => {
                    setFilterDateTo(e.target.value);
                    setPage(1);
                  }}
                  className={inputCls}
                />
              </div>
            </div>
            {(filterParentId || filterDateFrom || filterDateTo) && (
              <button
                type="button"
                onClick={() => {
                  setFilterParentId('');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                  setPage(1);
                }}
                className="mt-3 text-sm text-muted-foreground hover:text-foreground underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {addOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={resetForm} aria-hidden="true" />
          <div className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Add student</h2>
            <div className="mt-4">{renderForm(handleCreate, 'Create')}</div>
          </div>
        </>
      )}

      {editStudent && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={resetForm} aria-hidden="true" />
          <div className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Edit student</h2>
            <div className="mt-4">{renderForm(handleUpdate, 'Save')}</div>
          </div>
        </>
      )}

      {/* Card grid - 3 per row, horizontal Odoo-style cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {studentsLoading
          ? Array.from({ length: Math.min(perPage, 6) }).map((_, i) => (
              <StudentCardSkeleton key={i} />
            ))
          : students.map((s) => (
              <StudentCard key={s.id} student={s} onEdit={openEdit} canViewFee={canViewFee} canEdit={canCreate} />
            ))}
      </div>
      {/* Pagination */}
      {!studentsLoading && total > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={`${btnSecondary} h-9 px-3`}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={`${btnSecondary} h-9 px-3`}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {!studentsLoading && students.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
          <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">
            {total === 0 && !searchDebounced && !filterParentId && !filterDateFrom && !filterDateTo
              ? 'No students yet.'
              : 'No students match your filters.'}
          </p>
          {canCreate && (
            <button type="button" onClick={openAdd} className={`mt-4 ${btnPrimary}`}>
              <UserPlus className="h-4 w-4" />
              Add student
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function StudentsList() {
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || '';
  return (
    <ImageKitProvider urlEndpoint={urlEndpoint}>
      <StudentsListInner />
    </ImageKitProvider>
  );
}
