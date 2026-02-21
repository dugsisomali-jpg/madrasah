'use client';

import { useEffect, useState, useRef } from 'react';
import { Image, ImageKitProvider, upload } from '@imagekit/next';
import { Camera, User } from 'lucide-react';

type Student = {
  id: string;
  name: string;
  motherName?: string | null;
  motherPhone?: string | null;
  dateOfBirth?: Date | string | null;
  address?: string | null;
  imagePath?: string | null;
  fee?: number | string | null;
  parent?: { id: string; username: string; name?: string | null } | null;
  teacherId?: string | null;
  teacher?: { id: string; username: string; name?: string | null } | null;
};

type ParentUser = { id: string; username: string; name?: string | null; roles?: { name: string }[] };
type TeacherUser = { id: string; username: string; name?: string | null };

const inputCls =
  'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';
const btnPrimary = `${btnBase} bg-primary text-primary-foreground shadow-sm hover:bg-primary/90`;
const btnSecondary = `${btnBase} border border-input bg-background hover:bg-accent hover:text-accent-foreground`;

function Avatar({ imagePath, name }: { imagePath?: string | null; name: string }) {
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  if (!imagePath || !urlEndpoint) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
        <User className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }
  const src = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return (
    <Image
      src={src}
      width={96}
      height={96}
      transformation={[{ height: '96', width: '96', crop: 'at_max' }]}
      responsive={false}
      alt={name}
      className="h-12 w-12 shrink-0 rounded-full object-cover"
    />
  );
}

function StudentProfileEditModalInner({
  student,
  onClose,
  onSaved,
}: {
  student: Student;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: student.name,
    motherName: student.motherName ?? '',
    motherPhone: student.motherPhone ?? '',
    dateOfBirth: student.dateOfBirth ? String(student.dateOfBirth).slice(0, 10) : '',
    parentId: student.parent?.id ?? '',
    teacherId: student.teacherId ?? student.teacher?.id ?? '',
    address: student.address ?? '',
    imagePath: student.imagePath ?? '',
    fee: student.fee != null ? String(student.fee) : '',
  });
  const [parents, setParents] = useState<ParentUser[]>([]);
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [canViewFee, setCanViewFee] = useState(false);
  const [parentSearch, setParentSearch] = useState(student.parent ? student.parent.name || student.parent.username : '');
  const [parentDropdownOpen, setParentDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((users: ParentUser[]) => {
        const parentUsers = Array.isArray(users)
          ? users.filter((u) => u.roles?.some((r) => (r.name || '').toLowerCase() === 'parent'))
          : [];
        setParents(parentUsers);
      })
      .catch(() => setParents([]));
  }, []);
  useEffect(() => {
    fetch('/api/auth/permissions')
      .then((r) => r.json())
      .then((data) => setCanViewFee(Array.isArray(data.permissions) && data.permissions.includes('students.fee_viewer')))
      .catch(() => setCanViewFee(false));
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const authRes = await fetch('/api/imagekit/auth');
      const auth = await authRes.json();
      const { upload: ikUpload } = await import('@imagekit/next');
      const result = await ikUpload({
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

  const selectParent = (p: ParentUser) => {
    setForm((f) => ({ ...f, parentId: p.id }));
    setParentSearch(p.name || p.username);
    setParentDropdownOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    fetch(`/api/students/${student.id}`, {
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
      .then((r) => {
        if (r.ok) onSaved();
      })
      .finally(() => setLoading(false));
  };

  const filteredParents = parentSearch.trim()
    ? parents.filter(
        (p) =>
          (p.username || '').toLowerCase().includes(parentSearch.toLowerCase()) ||
          (p.name || '').toLowerCase().includes(parentSearch.toLowerCase())
      )
    : parents;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Edit profile</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Photo</label>
              <div className="flex items-center gap-4">
                <Avatar imagePath={form.imagePath} name={form.name} />
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
                    className={`${btnSecondary} text-xs h-8`}
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
                    {filteredParents.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-muted-foreground">No parents found</p>
                    ) : (
                      filteredParents.map((p) => (
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
                <label className="mb-1.5 block text-sm font-medium">Date of birth</label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                  className={inputCls}
                />
              </div>
              {canViewFee && (
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
            <button type="button" onClick={onClose} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={loading || uploading} className={btnPrimary}>
              {uploading ? 'Uploading…' : loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export function StudentProfileEditModal({
  student,
  onClose,
  onSaved,
}: {
  student: Student;
  onClose: () => void;
  onSaved: () => void;
}) {
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || '';
  return (
    <ImageKitProvider urlEndpoint={urlEndpoint}>
      <StudentProfileEditModalInner student={student} onClose={onClose} onSaved={onSaved} />
    </ImageKitProvider>
  );
}
