'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { SearchableSelect } from '@/components/SearchableSelect';
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
  'flex h-9 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2';

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
        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
          filtersOpen || hasFilters
            ? 'border-indigo-400 bg-indigo-50 text-indigo-800 dark:border-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-200'
            : 'border-input hover:bg-muted'
        }`}
      >
        <Filter className="h-4 w-4" />
        Filters
        {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {filtersOpen && (
        <div className="rounded-2xl border border-indigo-200/50 bg-indigo-50/30 p-5 dark:border-indigo-800/30 dark:bg-indigo-950/20">
          <p className="mb-3 text-sm font-medium text-indigo-800 dark:text-indigo-200">Filter by subject and more</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
              className="mt-3 text-sm text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={10} cols={6} className="border-indigo-200/50 dark:border-indigo-800/30" />
      ) : exams.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-indigo-200/60 bg-indigo-50/30 py-16 dark:border-indigo-800/40 dark:bg-indigo-950/20">
          <p className="text-sm text-muted-foreground">No exam results yet.</p>
          <p className="text-xs text-muted-foreground">Add a result by subject and student.</p>
        </div>
      ) : (
        <TableContainer className="border-indigo-200/50 dark:border-indigo-800/30">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-indigo-200/50 dark:border-indigo-800/30">
                <TableHead className="whitespace-nowrap">Student</TableHead>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="whitespace-nowrap">Subject</TableHead>
                <TableHead className="whitespace-nowrap">Type</TableHead>
                <TableHead className="whitespace-nowrap">Term</TableHead>
                <TableHead className="whitespace-nowrap">Marks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((e, i) => (
                <TableRow
                  key={e.id}
                  className={`border-indigo-100/50 dark:border-indigo-900/20 ${i % 2 === 1 ? 'bg-indigo-50/30 dark:bg-indigo-950/10' : ''}`}
                >
                  <TableCell className="font-medium">{e.Student?.name ?? '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">{e.date?.slice(0, 10)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-lg bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                      {e.Subject?.name ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{e.examType?.replace(/_/g, ' ')}</TableCell>
                  <TableCell>{e.term}</TableCell>
                  <TableCell className="whitespace-nowrap font-medium">{e.marks} / {e.maxMarks}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
