'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  AlertCircle,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Wallet,
  ArrowRight,
} from 'lucide-react';
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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type PaymentStatus = 'unpaid' | 'partial' | 'paid';
type ReceivableListItem = {
  paymentId: string;
  studentId: string;
  studentName: string;
  month: number;
  year: number;
  totalAmount: number;
  totalPaid: number;
  remainingBalance: number;
  paymentStatus: PaymentStatus;
  isOverdue: boolean;
  dueDate: string;
  daysOverdue: number;
  academicMonthKey: string;
};

type DashboardMetrics = {
  totalOutstandingBalance: number;
  totalOverdueAmount: number;
  unpaidStudentsCount: number;
  monthlyTrend: Array<{ month: number; year: number; outstanding: number; overdue: number }>;
  aging: { bucket0To30: number; bucket31To60: number; bucket61Plus: number };
};

function formatMoney(n: number): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function formatMonthYear(month: number, year: number): string {
  return `${MONTHS[month - 1]} ${year}`;
}

export function ReceivablesContent() {
  const [receivables, setReceivables] = useState<ReceivableListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [filterStudentId, setFilterStudentId] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'unpaid' | 'partial'>('');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setMetricsLoading(true);
    fetch('/api/receivables/dashboard')
      .then((r) => r.json())
      .then((data) => {
        if (data?.totalOutstandingBalance !== undefined) setMetrics(data);
        else setMetrics(null);
      })
      .catch(() => setMetrics(null))
      .finally(() => setMetricsLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStudentId) params.set('studentId', filterStudentId);
    if (filterPeriod) {
      const [y, m] = filterPeriod.split('-').map(Number);
      if (m) params.set('month', String(m));
      if (y) params.set('year', String(y));
    }
    if (filterStatus) params.set('status', filterStatus);
    if (searchDebounced) params.set('search', searchDebounced);
    params.set('page', String(page));
    params.set('perPage', String(perPage));
    fetch(`/api/receivables?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setReceivables(Array.isArray(data?.receivables) ? data.receivables : []);
        setTotal(Number(data?.total) ?? 0);
      })
      .catch(() => {
        setReceivables([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [filterStudentId, filterPeriod, filterStatus, searchDebounced, page, perPage]);

  useEffect(() => {
    setPage(1);
  }, [filterStudentId, filterPeriod, filterStatus, searchDebounced]);

  useEffect(() => {
    fetch('/api/students?perPage=500')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data?.students) ? data.students : [];
        setStudents(list.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
      })
      .catch(() => setStudents([]));
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-8">
      {/* Hero + Dashboard metrics */}
      <div className="rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-slate-100/80 p-6 dark:border-slate-700/50 dark:from-slate-800/50 dark:to-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:bg-amber-500/30 dark:text-amber-400">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Receivables</h2>
            <p className="text-sm text-muted-foreground">Outstanding balances derived from fees and payments</p>
          </div>
        </div>
        {metricsLoading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200/60 dark:bg-slate-700/40" />
            ))}
          </div>
        ) : metrics ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200/60 bg-card p-4 shadow-sm dark:border-slate-700/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Total outstanding</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {formatMoney(metrics.totalOutstandingBalance)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/60 bg-card p-4 shadow-sm dark:border-slate-700/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Overdue amount</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-destructive">
                {formatMoney(metrics.totalOverdueAmount)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/60 bg-card p-4 shadow-sm dark:border-slate-700/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Students with balance</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {metrics.unpaidStudentsCount}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/60 bg-card p-4 shadow-sm dark:border-slate-700/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Aging (0–30 / 31–60 / 61+ days)</span>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                {formatMoney(metrics.aging.bucket0To30)} / {formatMoney(metrics.aging.bucket31To60)} / {formatMoney(metrics.aging.bucket61Plus)}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200/60 bg-background px-3 py-2 dark:border-slate-700/50">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-44 bg-transparent text-sm outline-none placeholder:text-muted-foreground sm:w-52"
          />
        </div>
        <SearchableSelect
          options={[{ value: '', label: 'All students' }, ...students.map((s) => ({ value: s.id, label: s.name }))]}
          value={filterStudentId}
          onChange={setFilterStudentId}
          placeholder="All students"
          className="min-w-[180px]"
        />
        <select
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
          className="flex h-10 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <option value="">All months</option>
          {Array.from({ length: 24 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const y = d.getFullYear();
            const m = d.getMonth() + 1;
            const val = `${y}-${m}`;
            return (
              <option key={val} value={val}>
                {MONTHS[m - 1]} {y}
              </option>
            );
          })}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus((e.target.value || '') as '' | 'unpaid' | 'partial')}
          className="flex h-10 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <option value="">All statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-card shadow-sm dark:border-slate-700/50">
        <div className="border-b border-slate-200/60 bg-slate-50/80 px-6 py-4 dark:border-slate-700/50 dark:bg-slate-800/30">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Outstanding balances</h3>
          <p className="text-sm text-muted-foreground">Remaining = Fee total − Payments. No separate receivable storage.</p>
        </div>
        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={10} cols={8} />
          </div>
        ) : receivables.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="whitespace-nowrap">Student</TableHead>
                  <TableHead className="whitespace-nowrap">Academic month</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Total</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Paid</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Balance</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Due date</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivables.map((r) => (
                  <TableRow key={r.paymentId}>
                    <TableCell className="font-medium">{r.studentName}</TableCell>
                    <TableCell>{formatMonthYear(r.month, r.year)}</TableCell>
                    <TableCell className="text-right">{formatMoney(r.totalAmount)}</TableCell>
                    <TableCell className="text-right">{formatMoney(r.totalPaid)}</TableCell>
                    <TableCell className="text-right font-medium">{formatMoney(r.remainingBalance)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${
                          r.paymentStatus === 'unpaid'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300'
                        }`}
                      >
                        {r.paymentStatus === 'unpaid' ? 'Unpaid' : 'Partial'}
                      </span>
                      {r.isOverdue && (
                        <span className="ml-1.5 inline-flex rounded-lg bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          {r.daysOverdue}d overdue
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{r.dueDate}</TableCell>
                    <TableCell>
                      <Link
                        href={`/receivables/${r.studentId}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        View <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Wallet className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 font-medium text-muted-foreground">No outstanding receivables</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {total === 0 && !filterStudentId && !filterPeriod && !filterStatus && !searchDebounced
                ? 'All fees are paid or no payments exist yet.'
                : 'No records match your filters.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-input bg-background px-3 text-sm hover:bg-muted disabled:opacity-50"
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
              className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-input bg-background px-3 text-sm hover:bg-muted disabled:opacity-50"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
