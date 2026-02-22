'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, Receipt, Calendar, AlertCircle } from 'lucide-react';
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

function formatMoney(n: number): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function formatMonthYear(month: number, year: number): string {
  return `${MONTHS[month - 1]} ${year}`;
}

type PaymentStatus = 'unpaid' | 'partial' | 'paid';
type ReceivableSummary = {
  paymentId: string;
  month: number;
  year: number;
  totalAmount: number;
  totalPaid: number;
  remainingBalance: number;
  paymentStatus: PaymentStatus;
  isOverdue: boolean;
  dueDate: string;
  daysOverdue: number;
};

type StudentReceivableView = {
  studentId: string;
  studentName: string;
  totalOutstanding: number;
  receivables: ReceivableSummary[];
  paymentHistory: Array<{
    paymentId: string;
    month: number;
    year: number;
    totalAmount: number;
    totalPaid: number;
    remainingBalance: number;
    status: PaymentStatus;
    receipts: Array<{ id: string; amount: number; date: string; receiptNumber?: string | null }>;
  }>;
};

export function StudentReceivableViewContent({ studentId }: { studentId: string }) {
  const [view, setView] = useState<StudentReceivableView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/receivables/by-student/${studentId}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? 'Student not found' : 'Failed to load');
        return r.json();
      })
      .then(setView)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <TableSkeleton rows={6} cols={6} />
      </div>
    );
  }

  if (error || !view) {
    return (
      <div className="space-y-4">
        <Link
          href="/receivables"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Receivables
        </Link>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 py-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive/70" />
          <p className="mt-4 font-medium text-destructive">{error ?? 'Student not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/receivables"
            className="inline-flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Receivables
          </Link>
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">{view.studentName}</h1>
            <p className="text-sm text-muted-foreground">Outstanding balances and payment history</p>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-6 py-4 dark:border-amber-800/50 dark:bg-amber-900/20">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Wallet className="h-5 w-5" />
            <span className="text-sm font-medium">Total outstanding</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{formatMoney(view.totalOutstanding)}</p>
        </div>
      </div>

      {view.receivables.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-card shadow-sm dark:border-slate-700/50">
          <div className="border-b border-slate-200/60 bg-slate-50/80 px-6 py-4 dark:border-slate-700/50 dark:bg-slate-800/30">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Outstanding by month</h2>
            <p className="text-sm text-muted-foreground">Remaining balance per fee (payment) period</p>
          </div>
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="whitespace-nowrap">Academic month</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Total</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Paid</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Balance</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Due date</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.receivables.map((r) => (
                  <TableRow key={r.paymentId}>
                    <TableCell className="font-medium">{formatMonthYear(r.month, r.year)}</TableCell>
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
                        href={`/payments/${r.paymentId}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        View payment
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 py-8 text-center dark:border-slate-700/50 dark:bg-slate-800/20">
          <p className="font-medium text-muted-foreground">No outstanding balance for this student</p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-card shadow-sm dark:border-slate-700/50">
        <div className="flex items-center gap-3 border-b border-slate-200/60 bg-slate-50/80 px-6 py-4 dark:border-slate-700/50 dark:bg-slate-800/30">
          <Receipt className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Payment history</h2>
            <p className="text-sm text-muted-foreground">All fee periods and related receipts</p>
          </div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {view.paymentHistory.map((ph) => (
            <div key={ph.paymentId} className="px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatMonthYear(ph.month, ph.year)}</span>
                  <span
                    className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${
                      ph.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : ph.status === 'unpaid'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300'
                    }`}
                  >
                    {ph.status === 'paid' ? 'Paid' : ph.status === 'unpaid' ? 'Unpaid' : 'Partial'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span>Total: {formatMoney(ph.totalAmount)}</span>
                  <span>Paid: {formatMoney(ph.totalPaid)}</span>
                  <span className="font-medium">Balance: {formatMoney(ph.remainingBalance)}</span>
                  <Link
                    href={`/payments/${ph.paymentId}`}
                    className="text-primary hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
              {ph.receipts.length > 0 && (
                <ul className="mt-3 space-y-1 pl-6 text-sm text-muted-foreground">
                  {ph.receipts.map((rec) => (
                    <li key={rec.id}>
                      {formatMoney(rec.amount)} on {rec.date}
                      {rec.receiptNumber && ` — #${rec.receiptNumber}`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        {view.paymentHistory.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">No payment history</div>
        )}
      </div>
    </div>
  );
}
