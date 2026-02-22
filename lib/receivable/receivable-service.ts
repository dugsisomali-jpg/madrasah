/**
 * Receivable service — all values derived from Payment and Receipt.
 * No separate receivable table. No negative balances.
 */

import { prisma } from '@/lib/prisma';
import type {
  ReceivableSummary,
  ReceivableListItem,
  StudentReceivableView,
  ReceivableDashboardMetrics,
  PaymentStatus,
} from './types';

function toNum(v: unknown): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v) || 0;
}

/** Amount due for a payment (after discount). Remaining = amountDue - amountPaid. */
function amountDue(p: { totalDue: unknown; discount?: unknown }): number {
  return Math.max(0, toNum(p.totalDue) - toNum((p as { discount?: unknown }).discount));
}

function remainingBalance(p: { totalDue: unknown; amountPaid: unknown; discount?: unknown }): number {
  return Math.max(0, amountDue(p) - toNum(p.amountPaid));
}

function paymentStatus(p: { totalDue: unknown; amountPaid: unknown; discount?: unknown }): PaymentStatus {
  const due = amountDue(p);
  const paid = toNum(p.amountPaid);
  if (paid <= 0) return 'unpaid';
  if (paid >= due) return 'paid';
  return 'partial';
}

/** Last day of month (year, month) as ISO date string. */
function dueDateFor(year: number, month: number): string {
  const lastDay = new Date(year, month, 0); // month is 1-12
  return lastDay.toISOString().slice(0, 10);
}

function daysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - due.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(0, diff);
}

function toSummary(
  p: {
    id: string;
    studentId: string;
    month: number;
    year: number;
    totalDue: unknown;
    amountPaid: unknown;
    discount?: unknown;
    Student?: { name: string } | null;
  },
  studentName: string
): ReceivableSummary {
  const due = amountDue(p);
  const paid = toNum(p.amountPaid);
  const remaining = Math.max(0, due - paid);
  const dueDate = dueDateFor(p.year, p.month);
  const days = daysOverdue(dueDate);
  return {
    paymentId: p.id,
    studentId: p.studentId,
    studentName,
    month: p.month,
    year: p.year,
    totalAmount: due,
    totalPaid: paid,
    discount: toNum((p as { discount?: unknown }).discount),
    remainingBalance: remaining,
    paymentStatus: paymentStatus(p),
    isOverdue: days > 0 && remaining > 0,
    dueDate,
    daysOverdue: days,
  };
}

export interface ListReceivablesFilters {
  studentId?: string;
  month?: number;
  year?: number;
  status?: PaymentStatus;
  search?: string; // student name search
  page?: number;
  perPage?: number;
}

export interface ListReceivablesResult {
  receivables: ReceivableListItem[];
  total: number;
  page: number;
  perPage: number;
}

/** List receivables (unpaid or partially paid fees). Balance = totalDue - discount - amountPaid. */
export async function listReceivables(
  filters: ListReceivablesFilters,
  options: { filterByParentUserId?: string; filterByTeacherUserId?: string }
): Promise<ListReceivablesResult> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(100, Math.max(1, filters.perPage ?? 25));
  const skip = (page - 1) * perPage;

  const where: Record<string, unknown> = {};
  if (filters.studentId) where.studentId = filters.studentId;
  if (filters.month != null) where.month = filters.month;
  if (filters.year != null) where.year = filters.year;
  if (options.filterByParentUserId) {
    where.Student = { parentId: options.filterByParentUserId };
  } else if (options.filterByTeacherUserId) {
    where.Student = { teacherId: options.filterByTeacherUserId };
  }
  if (filters.search?.trim()) {
    where.Student = {
      ...(typeof where.Student === 'object' && where.Student ? where.Student : {}),
      name: { contains: filters.search.trim(), mode: 'insensitive' },
    };
  }

  const payments = await prisma.payment.findMany({
    where: where as object,
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    include: { Student: { select: { id: true, name: true } } },
  });

  const withBalance = payments
    .map((p) => ({ p, remaining: remainingBalance(p), status: paymentStatus(p) }))
    .filter(({ remaining }) => remaining > 0);
  if (filters.status) {
    const filtered = withBalance.filter(({ status }) => status === filters.status);
    const total = filtered.length;
    const slice = filtered.slice(skip, skip + perPage);
    const items: ReceivableListItem[] = slice.map(({ p }) => ({
      ...toSummary(p, p.Student?.name ?? ''),
      academicMonthKey: `${p.year}-${p.month}`,
    }));
    return { receivables: items, total, page, perPage };
  }

  const total = withBalance.length;
  const slice = withBalance.slice(skip, skip + perPage);
  const items: ReceivableListItem[] = slice.map(({ p }) => ({
    ...toSummary(p, p.Student?.name ?? ''),
    academicMonthKey: `${p.year}-${p.month}`,
  }));
  return { receivables: items, total, page, perPage };
}

/** Get receivable summary for a single fee (payment). */
export async function getReceivableSummaryByPaymentId(
  paymentId: string,
  options: { filterByParentUserId?: string; filterByTeacherUserId?: string }
): Promise<ReceivableSummary | null> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { Student: { select: { id: true, name: true } } },
  });
  if (!payment) return null;
  if (options.filterByParentUserId && (payment.Student as { parentId?: string } | null)?.parentId !== options.filterByParentUserId)
    return null;
  if (options.filterByTeacherUserId && (payment.Student as { teacherId?: string } | null)?.teacherId !== options.filterByTeacherUserId)
    return null;
  return toSummary(payment, payment.Student?.name ?? '');
}

/** Get all receivables for one student plus payment history. */
export async function getReceivablesByStudent(
  studentId: string,
  options: { filterByParentUserId?: string; filterByTeacherUserId?: string }
): Promise<StudentReceivableView | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, parentId: true, teacherId: true },
  });
  if (!student) return null;
  if (options.filterByParentUserId && student.parentId !== options.filterByParentUserId) return null;
  if (options.filterByTeacherUserId && student.teacherId !== options.filterByTeacherUserId) return null;

  const payments = await prisma.payment.findMany({
    where: { studentId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    include: { receipts: { orderBy: { date: 'desc' } } },
  });

  const receivables: ReceivableSummary[] = [];
  const paymentHistory: StudentReceivableView['paymentHistory'] = [];
  let totalOutstanding = 0;

  for (const p of payments) {
    const summary = toSummary(p, student.name);
    if (summary.remainingBalance > 0) {
      receivables.push(summary);
      totalOutstanding += summary.remainingBalance;
    }
    paymentHistory.push({
      paymentId: p.id,
      month: p.month,
      year: p.year,
      totalAmount: summary.totalAmount,
      totalPaid: summary.totalPaid,
      remainingBalance: summary.remainingBalance,
      status: summary.paymentStatus,
      receipts: p.receipts.map((r) => ({
        id: r.id,
        amount: toNum(r.amount),
        date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10),
        receiptNumber: r.receiptNumber,
      })),
    });
  }

  return {
    studentId: student.id,
    studentName: student.name,
    totalOutstanding,
    receivables,
    paymentHistory,
  };
}

/** Dashboard metrics: total outstanding, overdue, unpaid count, trend, aging. */
export async function getReceivableDashboardMetrics(options: {
  filterByParentUserId?: string;
  filterByTeacherUserId?: string;
}): Promise<ReceivableDashboardMetrics> {
  const where: Record<string, unknown> = {};
  if (options.filterByParentUserId) where.Student = { parentId: options.filterByParentUserId };
  else if (options.filterByTeacherUserId) where.Student = { teacherId: options.filterByTeacherUserId };

  const payments = await prisma.payment.findMany({
    where: where as object,
    include: { Student: { select: { id: true } } },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalOutstandingBalance = 0;
  let totalOverdueAmount = 0;
  const studentIdsWithBalance = new Set<string>();
  const byMonth = new Map<string, { outstanding: number; overdue: number }>();
  const aging = { bucket0To30: 0, bucket31To60: 0, bucket61Plus: 0 };

  for (const p of payments) {
    const remaining = remainingBalance(p);
    if (remaining <= 0) continue;
    totalOutstandingBalance += remaining;
    studentIdsWithBalance.add(p.studentId);
    const dueDate = dueDateFor(p.year, p.month);
    const days = daysOverdue(dueDate);
    if (days > 0) {
      totalOverdueAmount += remaining;
      if (days <= 30) aging.bucket0To30 += remaining;
      else if (days <= 60) aging.bucket31To60 += remaining;
      else aging.bucket61Plus += remaining;
    }
    const key = `${p.year}-${p.month}`;
    const current = byMonth.get(key) ?? { outstanding: 0, overdue: 0 };
    current.outstanding += remaining;
    if (days > 0) current.overdue += remaining;
    byMonth.set(key, current);
  }

  const monthlyTrend = Array.from(byMonth.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 12)
    .map(([key, v]) => {
      const [y, m] = key.split('-').map(Number);
      return { month: m, year: y, outstanding: v.outstanding, overdue: v.overdue };
    });

  return {
    totalOutstandingBalance,
    totalOverdueAmount,
    unpaidStudentsCount: studentIdsWithBalance.size,
    monthlyTrend,
    aging,
  };
}
