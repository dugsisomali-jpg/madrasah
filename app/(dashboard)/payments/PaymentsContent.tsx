'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { Plus, Receipt, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Users, User, ExternalLink, CalendarRange, Loader2, UsersRound, Calendar } from 'lucide-react';
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

type Student = { id: string; name: string; fee?: number | string | null };
type ReceiptRow = { id: string; amount: number | string; receiptNumber?: string | null; date: string; notes?: string | null };
type Payment = {
  id: string;
  studentId: string;
  month: number;
  year: number;
  feeAmount: number | string;
  balanceCarriedOver: number | string;
  totalDue: number | string;
  discount?: number | string;
  amountPaid: number | string;
  balanceDueDate?: string | null;
  canAddReceipt?: boolean;
  Student?: Student;
  receipts?: ReceiptRow[];
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const inputCls = 'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50';
const btnSecondary = 'inline-flex items-center justify-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted';

function n(v: number | string | unknown): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v) || 0;
}

export function PaymentsContent() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string; fee?: number | string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [receiptModal, setReceiptModal] = useState<Payment | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterStudentId, setFilterStudentId] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [createMode, setCreateMode] = useState<'all' | 'single'>('single');
  const [createStudentId, setCreateStudentId] = useState('');
  const [createPeriod, setCreatePeriod] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [receiptAmount, setReceiptAmount] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [receiptNotes, setReceiptNotes] = useState('');
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [rangeModalOpen, setRangeModalOpen] = useState(false);
  const [rangeStudentId, setRangeStudentId] = useState('');
  const [rangeMonthsCount, setRangeMonthsCount] = useState('');
  const [rangeAmount, setRangeAmount] = useState('');
  const [rangeReceiptNumber, setRangeReceiptNumber] = useState('');
  const [rangeReceiptDate, setRangeReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [rangeReceiptNotes, setRangeReceiptNotes] = useState('');
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangeAmountLoading, setRangeAmountLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [parentModalOpen, setParentModalOpen] = useState(false);
  const [parents, setParents] = useState<{ id: string; username: string; name?: string | null }[]>([]);
  const [parentId, setParentId] = useState('');
  const [parentPeriod, setParentPeriod] = useState('');
  const [parentPayments, setParentPayments] = useState<{ id: string; studentId: string; studentName: string; balance: number }[]>([]);
  const [parentTotalDue, setParentTotalDue] = useState(0);
  const [parentLoading, setParentLoading] = useState(false);
  const [parentReceiptNumber, setParentReceiptNumber] = useState('');
  const [parentReceiptDate, setParentReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [parentReceiptNotes, setParentReceiptNotes] = useState('');
  const [parentDiscount, setParentDiscount] = useState('');
  const [parentAmountToPay, setParentAmountToPay] = useState('');
  const [parentSubmitLoading, setParentSubmitLoading] = useState(false);
  const [dueDateModalPayment, setDueDateModalPayment] = useState<Payment | null>(null);
  const [dueDateModalValue, setDueDateModalValue] = useState('');
  const [dueDateModalSaving, setDueDateModalSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStudentId) params.set('studentId', filterStudentId);
    if (filterPeriod) {
      const [y, m] = filterPeriod.split('-').map(Number);
      if (m) params.set('month', String(m));
      if (y) params.set('year', String(y));
    }
    params.set('page', String(page));
    params.set('perPage', String(perPage));
    fetch(`/api/payments?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setPayments(Array.isArray(data?.payments) ? data.payments : []);
        setTotal(data?.total ?? 0);
      })
      .catch(() => {
        setPayments([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [filterStudentId, filterPeriod, page, perPage]);

  useEffect(() => {
    setPage(1);
  }, [filterStudentId, filterPeriod]);

  useEffect(() => {
    setPage(1);
  }, [perPage]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(total / perPage));
    setPage((p) => Math.min(p, maxPage));
  }, [total, perPage]);

  const loadPayments = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStudentId) params.set('studentId', filterStudentId);
    if (filterPeriod) {
      const [y, m] = filterPeriod.split('-').map(Number);
      if (m) params.set('month', String(m));
      if (y) params.set('year', String(y));
    }
    params.set('page', String(page));
    params.set('perPage', String(perPage));
    fetch(`/api/payments?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setPayments(Array.isArray(data?.payments) ? data.payments : []);
        setTotal(data?.total ?? 0);
      })
      .catch(() => {
        setPayments([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  };

  const openDueDateModal = (p: Payment) => {
    const d = p.balanceDueDate;
    setDueDateModalValue(d ? (typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)) : '');
    setDueDateModalPayment(p);
  };

  const saveDueDateModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDateModalPayment) return;
    setDueDateModalSaving(true);
    fetch(`/api/payments/${dueDateModalPayment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ balanceDueDate: dueDateModalValue.trim() || null }),
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to save');
        setDueDateModalPayment(null);
        loadPayments();
        Swal.fire({ icon: 'success', title: 'Saved', text: 'Due date updated.' });
      })
      .catch(() => Swal.fire({ icon: 'error', title: 'Error', text: 'Could not save due date.' }))
      .finally(() => setDueDateModalSaving(false));
  };

  useEffect(() => {
    fetch('/api/students')
      .then((r) => r.json())
      .then((data) => setStudents(Array.isArray(data?.students) ? data.students : []))
      .catch(() => setStudents([]));
  }, []);

  useEffect(() => {
    if (parentModalOpen) {
      fetch('/api/users/parents?hasStudents=true')
        .then((r) => r.json())
        .then((data) => setParents(Array.isArray(data) ? data : []))
        .catch(() => setParents([]));
    }
  }, [parentModalOpen]);

  useEffect(() => {
    if (!parentId || !parentPeriod) {
      setParentPayments([]);
      setParentTotalDue(0);
      return;
    }
    const [y, m] = parentPeriod.split('-');
    setParentLoading(true);
    const params = new URLSearchParams({ parentId, month: m, year: y });
    fetch(`/api/payments/by-parent?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setParentPayments(data?.payments ?? []);
        setParentTotalDue(data?.totalDue ?? 0);
      })
      .catch(() => {
        setParentPayments([]);
        setParentTotalDue(0);
      })
      .finally(() => setParentLoading(false));
  }, [parentId, parentPeriod]);

  useEffect(() => {
    if (!parentId || !parentPeriod || parentPayments.length === 0) {
      setParentReceiptNotes('');
      return;
    }
    const parent = parents.find((p) => p.id === parentId);
    const parentName = parent?.name || parent?.username || 'Parent';
    const [, m] = parentPeriod.split('-').map(Number);
    setParentReceiptNotes(`Payment by ${parentName} for ${MONTHS[m - 1]} ${parentPeriod.slice(0, 4)} – ${parentPayments.length} student(s)`);
  }, [parentId, parentPeriod, parentPayments.length, parents]);

  const parentAmountAfterDiscount = Math.max(0, parentTotalDue - (parseFloat(parentDiscount) || 0));
  useEffect(() => {
    setParentAmountToPay(parentAmountAfterDiscount > 0 ? String(parentAmountAfterDiscount) : '');
  }, [parentAmountAfterDiscount]);

  useEffect(() => {
    fetch('/api/auth/permissions')
      .then((r) => r.json())
      .then((data) => {
        const perms = Array.isArray(data?.permissions) ? data.permissions : [];
        setCanManage(perms.includes('payments.manage'));
      })
      .catch(() => setCanManage(false));
  }, []);

  useEffect(() => {
    const n = parseInt(rangeMonthsCount, 10);
    if (!rangeStudentId || !rangeMonthsCount || isNaN(n) || n < 1) {
      setRangeAmount('');
      setRangeAmountLoading(false);
      return;
    }
    const currM = new Date().getMonth() + 1;
    const currY = new Date().getFullYear();
    const fromM = currM;
    const fromY = currY;
    const addMonths = n - 1;
    const toM = ((fromM - 1 + addMonths) % 12) + 1;
    const toY = fromY + Math.floor((fromM - 1 + addMonths) / 12);
    setRangeAmountLoading(true);
    const params = new URLSearchParams({
      studentId: rangeStudentId,
      fromMonth: String(fromM),
      fromYear: String(fromY),
      toMonth: String(toM),
      toYear: String(toY),
    });
    fetch(`/api/receipts/expected?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const amount = data?.requiredAmount ?? 0;
        setRangeAmount(amount > 0 ? String(amount) : '');
      })
      .catch(() => setRangeAmount(''))
      .finally(() => setRangeAmountLoading(false));
  }, [rangeStudentId, rangeMonthsCount]);

  useEffect(() => {
    const n = parseInt(rangeMonthsCount, 10);
    if (!rangeMonthsCount || isNaN(n) || n < 1) {
      setRangeReceiptNotes('');
      return;
    }
    const currM = new Date().getMonth() + 1;
    const currY = new Date().getFullYear();
    const fromM = currM;
    const fromY = currY;
    const addMonths = n - 1;
    const toM = ((fromM - 1 + addMonths) % 12) + 1;
    const toY = fromY + Math.floor((fromM - 1 + addMonths) / 12);
    setRangeReceiptNotes(`Advance payment for ${MONTHS[fromM - 1]} ${fromY} - ${MONTHS[toM - 1]} ${toY}`);
  }, [rangeMonthsCount]);

  const getRangeFromMonths = (monthsCount: string) => {
    const n = parseInt(monthsCount, 10);
    if (!monthsCount || isNaN(n) || n < 1) return null;
    const currM = new Date().getMonth() + 1;
    const currY = new Date().getFullYear();
    const fromM = currM;
    const fromY = currY;
    const addMonths = n - 1;
    const toM = ((fromM - 1 + addMonths) % 12) + 1;
    const toY = fromY + Math.floor((fromM - 1 + addMonths) / 12);
    return { fromM, fromY, toM, toY };
  };

  const handleAddRangeReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    const range = getRangeFromMonths(rangeMonthsCount);
    if (!rangeStudentId || !range || !rangeAmount || parseFloat(rangeAmount) <= 0) return;
    const { fromM, fromY, toM, toY } = range;
    setRangeLoading(true);
    fetch('/api/receipts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: rangeStudentId,
        fromMonth: fromM,
        fromYear: fromY,
        toMonth: toM,
        toYear: toY,
        totalAmount: parseFloat(rangeAmount),
        receiptNumber: rangeReceiptNumber || undefined,
        date: rangeReceiptDate,
        notes: rangeReceiptNotes || undefined,
      }),
    })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setRangeModalOpen(false);
          setRangeStudentId('');
          setRangeMonthsCount('');
          setRangeAmount('');
          setRangeReceiptNumber('');
          setRangeReceiptDate(new Date().toISOString().slice(0, 10));
          setRangeReceiptNotes('');
          loadPayments();
          Swal.fire({
            icon: 'success',
            title: 'Receipt(s) added',
            text: data.skipped > 0
              ? `Created ${data.created} receipt(s) for ${data.months} month(s) (${data.skipped} already paid, skipped).`
              : `Created ${data.created} receipt(s) for ${data.months} month(s) – ${rangeAmount} KES.`,
          });
        } else {
          const err = await r.json().catch(() => ({}));
          const payloadStr = err?.payload ? `\n\nPayload: ${JSON.stringify(err.payload)}` : '';
          Swal.fire({
            icon: 'error',
            title: 'Cannot add receipt',
            text: `${err?.error || 'Failed to add receipt'}${err?.details ? `\n${err.details}` : ''}${payloadStr}`,
          });
        }
      })
      .finally(() => setRangeLoading(false));
  };

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createPeriod) return;
    if (createMode === 'single' && !createStudentId) return;
    const [y, m] = createPeriod.split('-').map(Number);
    setCreateLoading(true);
    const body = createMode === 'single'
      ? { studentId: createStudentId, month: m, year: y }
      : { month: m, year: y };
    fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setCreateStudentId('');
          setCreatePeriod('');
          setModalOpen(false);
          loadPayments();
          if (createMode === 'all' && data?.created != null) {
            const skippedMsg = data.skipped > 0 ? ` (${data.skipped} already had payment, skipped)` : '';
            Swal.fire({
              icon: 'success',
              title: 'Payments created',
              text: `Created ${data.created} payment(s) for ${createPeriod ? `${createPeriod.slice(5)}/${createPeriod.slice(0, 4)}` : ''}${skippedMsg}.`,
            });
          }
        } else {
          const err = await r.json().catch(() => ({}));
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err?.error || 'Failed to create payment(s)',
          });
        }
      })
      .finally(() => setCreateLoading(false));
  };

  const handleAddReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptModal || !receiptAmount || parseFloat(receiptAmount) <= 0) return;
    setReceiptLoading(true);
    fetch(`/api/payments/${receiptModal.id}/receipts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parseFloat(receiptAmount),
        receiptNumber: receiptNumber || undefined,
        date: receiptDate,
        notes: receiptNotes || undefined,
      }),
    })
      .then(async (r) => {
        if (r.ok) {
          setReceiptAmount('');
          setReceiptNumber('');
          setReceiptDate(new Date().toISOString().slice(0, 10));
          setReceiptNotes('');
          setReceiptModal(null);
          loadPayments();
        } else {
          const err = await r.json().catch(() => ({}));
          Swal.fire({
            icon: 'error',
            title: 'Cannot add receipt',
            text: err?.error || 'Failed to add receipt',
          });
        }
      })
      .finally(() => setReceiptLoading(false));
  };

  const handleParentPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentId || !parentPeriod || parentTotalDue <= 0) return;
    const amountToPay = parseFloat(parentAmountToPay) || 0;
    if (amountToPay <= 0) return;
    const [y, m] = parentPeriod.split('-').map(Number);
    setParentSubmitLoading(true);
    fetch('/api/receipts/by-parent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentId,
        month: m,
        year: y,
        totalAmount: amountToPay,
        discount: parseFloat(parentDiscount) || 0,
        receiptNumber: parentReceiptNumber || undefined,
        date: parentReceiptDate,
        notes: parentReceiptNotes || undefined,
      }),
    })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setParentModalOpen(false);
          setParentId('');
          setParentPeriod('');
          setParentReceiptNumber('');
          setParentReceiptDate(new Date().toISOString().slice(0, 10));
          setParentReceiptNotes('');
          setParentDiscount('');
          setParentAmountToPay('');
          loadPayments();
          Swal.fire({
            icon: 'success',
            title: 'Receipts added',
            text: `Created ${data.created} receipt(s) for ${data.totalAmount.toLocaleString()} KES – ${MONTHS[data.month - 1]} ${data.year}.`,
          });
        } else {
          const err = await r.json().catch(() => ({}));
          Swal.fire({
            icon: 'error',
            title: 'Cannot add receipt',
            text: `${err?.error || 'Failed to add receipt'}${err?.details ? `\n${JSON.stringify(err.details)}` : ''}`,
          });
        }
      })
      .finally(() => setParentSubmitLoading(false));
  };

  const currYear = new Date().getFullYear();
  const currMonth = new Date().getMonth() + 1;

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIdx = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endIdx = Math.min(currentPage * perPage, total);

  const computedRange = (() => {
    const n = parseInt(rangeMonthsCount, 10);
    if (!rangeMonthsCount || isNaN(n) || n < 1) return null;
    const fromM = currMonth;
    const fromY = currYear;
    const addMonths = n - 1;
    const toM = ((fromM - 1 + addMonths) % 12) + 1;
    const toY = fromY + Math.floor((fromM - 1 + addMonths) / 12);
    return { rangeFrom: `${fromY}-${String(fromM).padStart(2, '0')}`, rangeTo: `${toY}-${String(toM).padStart(2, '0')}`, fromM, fromY, toM, toY };
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${filtersOpen ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted'}`}
        >
          Filters
          {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setParentModalOpen(true)}
              className={btnSecondary}
            >
              <UsersRound className="h-4 w-4" />
              Pay by parent
            </button>
            <button
              type="button"
              onClick={() => setRangeModalOpen(true)}
              className={btnSecondary}
            >
              <CalendarRange className="h-4 w-4" />
              Pay forward
            </button>
            <button type="button" onClick={() => setModalOpen(true)} className={btnPrimary}>
              <Plus className="h-4 w-4" />
              Create payment
            </button>
          </div>
        )}
      </div>

      {filtersOpen && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="grid gap-4 sm:grid-cols-3">
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
              <label className="mb-1.5 block text-sm font-medium">Period</label>
              <div className="flex gap-2">
                <input
                  type="month"
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className={inputCls}
                />
                {filterPeriod && (
                  <button
                    type="button"
                    onClick={() => setFilterPeriod('')}
                    className="rounded-lg border border-input px-2 text-sm hover:bg-muted"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={8} cols={9} />
      ) : payments.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 py-16 text-center">
          <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">No payments yet.</p>
          {canManage && (
            <button type="button" onClick={() => setModalOpen(true)} className={`mt-4 ${btnPrimary}`}>
              <Plus className="h-4 w-4" />
              Create payment
            </button>
          )}
        </div>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="whitespace-nowrap">Student</TableHead>
                  <TableHead className="whitespace-nowrap">Period</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Fee</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Previous</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Total due</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Discount</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Paid</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Balance</TableHead>
                  <TableHead className="whitespace-nowrap">Due date</TableHead>
                  <TableHead className="text-center whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p, i) => {
                  const balance = n(p.totalDue) - n(p.discount) - n(p.amountPaid);
                  const hasCarriedOver = n(p.balanceCarriedOver) > 0;
                  const dueDateStr = p.balanceDueDate
                    ? (typeof p.balanceDueDate === 'string' ? p.balanceDueDate.slice(0, 10) : new Date(p.balanceDueDate).toISOString().slice(0, 10))
                    : null;
                  return (
                    <TableRow key={p.id} className={i % 2 === 1 ? 'bg-muted/5' : ''}>
                      <TableCell className="font-medium">{p.Student?.name ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{MONTHS[p.month - 1]} {p.year}</TableCell>
                      <TableCell className="text-right">{n(p.feeAmount).toLocaleString()} KES</TableCell>
                      <TableCell className="text-right">
                        {hasCarriedOver ? (
                          <span className="text-amber-600">{n(p.balanceCarriedOver).toLocaleString()} KES</span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">{n(p.totalDue).toLocaleString()} KES</TableCell>
                      <TableCell className="text-right text-muted-foreground">{n(p.discount).toLocaleString()} KES</TableCell>
                      <TableCell className="text-right">{n(p.amountPaid).toLocaleString()} KES</TableCell>
                      <TableCell className={`text-right font-medium ${balance > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                        {balance.toLocaleString()} KES
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {dueDateStr ? (
                          canManage ? (
                            <button
                              type="button"
                              onClick={() => openDueDateModal(p)}
                              className="text-xs text-amber-600 hover:underline dark:text-amber-400"
                            >
                              {dueDateStr}
                            </button>
                          ) : (
                            <span className="text-muted-foreground">{dueDateStr}</span>
                          )
                        ) : balance > 0 && canManage ? (
                          <button
                            type="button"
                            onClick={() => openDueDateModal(p)}
                            className="text-xs text-amber-600 hover:underline dark:text-amber-400"
                          >
                            Set due date
                          </button>
                        ) : balance > 0 ? (
                          <Link
                            href={`/payments/${p.id}`}
                            className="text-xs text-amber-600 hover:underline dark:text-amber-400"
                          >
                            Set in Detail
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <Link
                            href={`/payments/${p.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium hover:bg-muted"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Detail
                          </Link>
                          {canManage && balance > 0 && (
                            p.canAddReceipt !== false ? (
                              <button
                                type="button"
                                onClick={() => setReceiptModal(p)}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 px-2 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              >
                                <Receipt className="h-3.5 w-3.5" />
                                Add receipt
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Balance carried to next month</span>
                            )
                          )}
                          {balance > 0 && dueDateStr && (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50/80 px-2 py-1.5 text-xs font-medium text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-200">
                              <Calendar className="h-3.5 w-3.5" />
                              Due {dueDateStr}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <div className="flex flex-col gap-4 rounded-b-2xl border border-t-0 border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Per page</span>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <span className="text-sm text-muted-foreground">
                Showing {total === 0 ? 0 : startIdx}–{endIdx} of {total}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-input px-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-input px-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {dueDateModalPayment && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setDueDateModalPayment(null)} aria-hidden="true" />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-slate-200/60 bg-card shadow-2xl dark:border-slate-700/50">
            <div className="border-b border-border bg-gradient-to-r from-amber-50 to-transparent px-6 py-4 dark:from-amber-900/20">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Set due date for balance
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {dueDateModalPayment.Student?.name ?? 'Student'} — {MONTHS[dueDateModalPayment.month - 1]} {dueDateModalPayment.year}
              </p>
              <p className="mt-0.5 text-sm font-medium text-destructive">
                Balance: {(n(dueDateModalPayment.totalDue) - n(dueDateModalPayment.discount) - n(dueDateModalPayment.amountPaid)).toLocaleString()} KES
              </p>
            </div>
            <form onSubmit={saveDueDateModal} className="p-6">
              <div>
                <label htmlFor="dueDateModalInput" className="mb-1.5 block text-sm font-medium">
                  Pay by date
                </label>
                <input
                  id="dueDateModalInput"
                  type="date"
                  value={dueDateModalValue}
                  onChange={(e) => setDueDateModalValue(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                />
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDueDateModalPayment(null)}
                  className={btnSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dueDateModalSaving}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-600 px-5 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  {dueDateModalSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {modalOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setModalOpen(false)} aria-hidden="true" />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Create payment</h2>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setCreateMode('all')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${createMode === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-input hover:bg-muted'}`}
              >
                <Users className="h-4 w-4" />
                All students
              </button>
              <button
                type="button"
                onClick={() => setCreateMode('single')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${createMode === 'single' ? 'border-primary bg-primary/10 text-primary' : 'border-input hover:bg-muted'}`}
              >
                <User className="h-4 w-4" />
                Per student
              </button>
            </div>
            <form onSubmit={handleCreatePayment} className="mt-4 space-y-4">
              {createMode === 'single' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Student</label>
                  <SearchableSelect
                    options={students.map((s) => ({
                      value: s.id,
                      label: `${s.name} (fee: ${n(s.fee).toLocaleString()} KES)`,
                    }))}
                    value={createStudentId}
                    onChange={setCreateStudentId}
                    placeholder="Select student"
                    required={createMode === 'single'}
                    className="w-full"
                  />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium">Period</label>
                <input
                  type="month"
                  value={createPeriod}
                  onChange={(e) => setCreatePeriod(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
              {createMode === 'all' && (
                <p className="text-xs text-muted-foreground">
                  Creates payments for all students who have a fee set and don&apos;t already have one for this month. Skips students with no fee (null/undefined) and existing payments.
                </p>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className={btnSecondary}>
                  Cancel
                </button>
                <button type="submit" disabled={createLoading} className={btnPrimary}>
                  {createLoading ? 'Creating…' : createMode === 'all' ? 'Create for all students' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {parentModalOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setParentModalOpen(false)} aria-hidden="true" />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Pay by parent</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pay for all children of a parent at once. Select parent and month/year, then add receipt(s) for the total.
            </p>
            <form onSubmit={handleParentPaySubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Parent</label>
                  <SearchableSelect
                    options={parents.map((p) => ({
                      value: p.id,
                      label: p.name || p.username || p.id,
                    }))}
                    value={parentId}
                    onChange={setParentId}
                    placeholder="Select parent"
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Period</label>
                  <input
                    type="month"
                    value={parentPeriod}
                    onChange={(e) => setParentPeriod(e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>
              </div>
              {parentLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              )}
              {!parentLoading && parentPayments.length > 0 && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="mb-2 text-sm font-medium">Children ({parentPayments.length})</p>
                  <ul className="max-h-32 space-y-1 overflow-y-auto text-sm">
                    {parentPayments.map((p) => (
                      <li key={p.id || p.studentId} className="flex justify-between">
                        <span>{p.studentName}</span>
                        <span className="font-medium">{p.balance.toLocaleString()} KES</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 border-t pt-2 text-sm font-semibold">
                    Total: {parentTotalDue.toLocaleString()} KES
                  </p>
                </div>
              )}
              {!parentLoading && parentPayments.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Discount (KES)</label>
                    <input
                      type="number"
                      min={0}
                      max={parentTotalDue}
                      step={0.01}
                      value={parentDiscount}
                      onChange={(e) => setParentDiscount(e.target.value)}
                      className={inputCls}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Amount to pay (KES)</label>
                    <input
                      type="number"
                      min={0}
                      max={parentAmountAfterDiscount}
                      step={0.01}
                      value={parentAmountToPay}
                      onChange={(e) => setParentAmountToPay(e.target.value)}
                      className={inputCls}
                      placeholder={String(parentAmountAfterDiscount)}
                      required
                    />
                    {parentAmountAfterDiscount > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Pay up to {parentAmountAfterDiscount.toLocaleString()} KES (partial payment allowed)
                      </p>
                    )}
                  </div>
                </div>
              )}
              {!parentLoading && parentId && parentPeriod && parentPayments.length === 0 && (
                <p className="text-sm text-muted-foreground">No unpaid balances for this parent&apos;s children this month.</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Receipt number</label>
                  <input
                    value={parentReceiptNumber}
                    onChange={(e) => setParentReceiptNumber(e.target.value)}
                    className={inputCls}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Date</label>
                  <input
                    type="date"
                    value={parentReceiptDate}
                    onChange={(e) => setParentReceiptDate(e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Notes</label>
                <textarea
                  value={parentReceiptNotes}
                  onChange={(e) => setParentReceiptNotes(e.target.value)}
                  rows={2}
                  className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Optional"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setParentModalOpen(false)} className={btnSecondary}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    parentSubmitLoading ||
                    parentLoading ||
                    parentPayments.length === 0 ||
                    parentTotalDue <= 0 ||
                    !parentAmountToPay ||
                    (parseFloat(parentAmountToPay) || 0) <= 0
                  }
                  className={btnPrimary}
                >
                  {parentSubmitLoading ? 'Adding…' : 'Add receipt(s)'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {rangeModalOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setRangeModalOpen(false)} aria-hidden="true" />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Pay forward (range of months)</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pay for coming months in advance. Select student, then enter number of months. Payment records will be created if needed.
            </p>
            <form onSubmit={handleAddRangeReceipt} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Student</label>
                <SearchableSelect
                  options={students.map((s) => ({
                    value: s.id,
                    label: `${s.name} (fee: ${n(s.fee).toLocaleString()} KES/month)`,
                  }))}
                  value={rangeStudentId}
                  onChange={setRangeStudentId}
                  placeholder="Select student"
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Number of months</label>
                <input
                  type="number"
                  min={1}
                  value={rangeMonthsCount}
                  onChange={(e) => setRangeMonthsCount(e.target.value)}
                  disabled={!rangeStudentId}
                  required
                  placeholder={rangeStudentId ? 'e.g. 3' : 'Select student first'}
                  className={`${inputCls} ${!rangeStudentId ? 'cursor-not-allowed bg-muted opacity-60' : ''}`}
                />
                {computedRange && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Range: {MONTHS[computedRange.fromM - 1]} {computedRange.fromY} – {MONTHS[computedRange.toM - 1]} {computedRange.toY}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Amount (KES)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={rangeAmountLoading ? '' : rangeAmount ? `${Number(rangeAmount).toLocaleString()} KES` : ''}
                    readOnly
                    className={`${inputCls} bg-muted cursor-not-allowed ${rangeAmountLoading ? 'text-muted-foreground' : ''}`}
                    placeholder={rangeAmountLoading ? 'Calculating…' : 'Select student and enter months to calculate'}
                  />
                  {rangeAmountLoading && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Receipt number</label>
                  <input
                    value={rangeReceiptNumber}
                    onChange={(e) => setRangeReceiptNumber(e.target.value)}
                    className={inputCls}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Date</label>
                  <input
                    type="date"
                    value={rangeReceiptDate}
                    onChange={(e) => setRangeReceiptDate(e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Notes</label>
                <textarea
                  value={rangeReceiptNotes}
                  onChange={(e) => setRangeReceiptNotes(e.target.value)}
                  rows={2}
                  className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Optional"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setRangeModalOpen(false)} className={btnSecondary}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rangeLoading || rangeAmountLoading || !rangeAmount || parseFloat(rangeAmount || '0') <= 0 || !rangeStudentId || !rangeMonthsCount || !computedRange}
                  className={btnPrimary}
                >
                  {rangeLoading ? 'Adding…' : 'Add receipt(s)'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {receiptModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setReceiptModal(null)} aria-hidden="true" />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Add receipt</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {receiptModal.Student?.name} – {MONTHS[receiptModal.month - 1]} {receiptModal.year} | Balance due: {(n(receiptModal.totalDue) - n(receiptModal.discount) - n(receiptModal.amountPaid)).toLocaleString()} KES
            </p>
            <form onSubmit={handleAddReceipt} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Amount (KES)</label>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Receipt number</label>
                  <input
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    className={inputCls}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Date</label>
                  <input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Notes</label>
                <textarea
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  rows={2}
                  className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Optional"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setReceiptModal(null)} className={btnSecondary}>
                  Cancel
                </button>
                <button type="submit" disabled={receiptLoading} className={btnPrimary}>
                  {receiptLoading ? 'Adding…' : 'Add receipt'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
