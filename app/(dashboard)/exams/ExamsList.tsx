'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SearchableSelect } from '@/components/SearchableSelect';

type ExamResult = {
  id: string;
  examType: string;
  term: string;
  marks: number;
  maxMarks: number;
  date: string;
  Subject?: { name: string };
  Student?: { id: string; name: string };
};

type Parent = { id: string; username: string; name?: string | null };
type Teacher = { id: string; username: string; name?: string | null };
type Subject = { id: string; name: string };
type Student = { id: string; name: string };

const selectCls =
  'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function ExamsList() {
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterStudentId, setFilterStudentId] = useState('');
  const [filterParentId, setFilterParentId] = useState('');
  const [filterTeacherId, setFilterTeacherId] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [sort, setSort] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    fetch('/api/students?perPage=500')
      .then((r) => r.json())
      .then((data) => setStudents(Array.isArray(data?.students) ? data.students : []))
      .catch(() => setStudents([]));
    fetch('/api/users/parents?hasStudents=true')
      .then((r) => r.json())
      .then((data) => setParents(Array.isArray(data) ? data : []))
      .catch(() => setParents([]));
    fetch('/api/users/teachers')
      .then((r) => r.json())
      .then((data) => setTeachers(Array.isArray(data) ? data : []))
      .catch(() => setTeachers([]));
    fetch('/api/subjects')
      .then((r) => r.json())
      .then((data) => setSubjects(Array.isArray(data) ? data : []))
      .catch(() => setSubjects([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStudentId) params.set('studentId', filterStudentId);
    if (filterParentId) params.set('parentId', filterParentId);
    if (filterTeacherId) params.set('teacherId', filterTeacherId);
    if (filterSubjectId) params.set('subjectId', filterSubjectId);
    if (sort) params.set('sort', sort);
    fetch(`/api/exams?${params}`)
      .then((r) => r.json())
      .then((data) => setExams(Array.isArray(data) ? data : []))
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }, [filterStudentId, filterParentId, filterTeacherId, filterSubjectId, sort]);

  const hasFilters = filterStudentId || filterParentId || filterTeacherId || filterSubjectId || sort;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setFiltersOpen((o) => !o)}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
          filtersOpen || hasFilters ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted'
        }`}
      >
        Filters
        {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {filtersOpen && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Student</label>
              <SearchableSelect
                options={[{ value: '', label: 'All students' }, ...students.map((s) => ({ value: s.id, label: s.name }))]}
                value={filterStudentId}
                onChange={setFilterStudentId}
                placeholder="All students"
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Parent</label>
              <SearchableSelect
                options={[{ value: '', label: 'All parents' }, ...parents.map((p) => ({ value: p.id, label: p.name || p.username || p.id }))]}
                value={filterParentId}
                onChange={setFilterParentId}
                placeholder="All parents"
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Teacher</label>
              <SearchableSelect
                options={[{ value: '', label: 'All teachers' }, ...teachers.map((t) => ({ value: t.id, label: t.name || t.username || t.id }))]}
                value={filterTeacherId}
                onChange={setFilterTeacherId}
                placeholder="All teachers"
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Subject</label>
              <select value={filterSubjectId} onChange={(e) => setFilterSubjectId(e.target.value)} className={selectCls}>
                <option value="">All subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Sort by marks</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectCls}>
                <option value="">Date (newest first)</option>
                <option value="lowest">Lowest first</option>
                <option value="highest">Highest first</option>
              </select>
            </div>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setFilterStudentId('');
                setFilterParentId('');
                setFilterTeacherId('');
                setFilterSubjectId('');
                setSort('');
              }}
              className="mt-3 text-sm text-muted-foreground hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : exams.length === 0 ? (
        <p className="text-muted-foreground">No exam results yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow">
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Student</th>
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Date</th>
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Subject</th>
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Type</th>
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Term</th>
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Marks</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((e) => (
                  <tr key={e.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">{e.Student?.name ?? '—'}</td>
                    <td className="p-4 align-middle whitespace-nowrap">{e.date?.slice(0, 10)}</td>
                    <td className="p-4 align-middle">{e.Subject?.name ?? '—'}</td>
                    <td className="p-4 align-middle whitespace-nowrap">{e.examType?.replace(/_/g, ' ')}</td>
                    <td className="p-4 align-middle">{e.term}</td>
                    <td className="p-4 align-middle whitespace-nowrap">{e.marks} / {e.maxMarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
