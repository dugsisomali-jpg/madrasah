'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { ArrowLeft, Plus, Receipt, Printer, FileDown, Calendar } from 'lucide-react';
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

function ReceiptPrintable({
  payment,
  receipt,
  onPrint,
  onExportPdf,
  isExportingPdf,
}: {
  payment: Payment;
  receipt: ReceiptRow;
  onPrint: (el: HTMLElement) => void;
  onExportPdf: (el: HTMLElement) => void;
  isExportingPdf?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hasCarriedOver = n(payment.balanceCarriedOver) > 0;
  const dateStr = typeof receipt.date === 'string' ? receipt.date.slice(0, 10) : String(receipt.date);

  return (
    <div className="space-y-4">
      <div
        ref={ref}
        className="receipt-print-content w-full max-w-md rounded-lg border bg-white p-6 text-black print:border-0 print:shadow-none"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        <h2 className="border-b-2 border-black pb-2 text-lg font-bold">RECEIPT</h2>
        <div className="mt-4 space-y-1 text-sm">
          <p><strong>Student:</strong> {payment.Student?.name ?? '—'}</p>
          <p><strong>Period:</strong> {MONTHS[payment.month - 1]} {payment.year}</p>
          <p><strong>Receipt #:</strong> {receipt.receiptNumber || '—'}</p>
          <p><strong>Date:</strong> {dateStr}</p>
          {hasCarriedOver && (
            <p className="text-amber-700"><strong>Previous balance:</strong> {n(payment.balanceCarriedOver).toLocaleString()} KES</p>
          )}
          <p><strong>Monthly fee:</strong> {n(payment.feeAmount).toLocaleString()} KES</p>
          <p><strong>Amount paid:</strong> {n(receipt.amount).toLocaleString()} KES</p>
          {receipt.notes && <p><strong>Notes:</strong> {receipt.notes}</p>}
        </div>
        <p className="mt-6 border-t pt-4 text-xs text-gray-600">
          Thank you for your payment. Madrasah Academic System.
        </p>
      </div>
      <div className="flex gap-2 print:hidden">
        <button
          type="button"
          onClick={() => ref.current && onPrint(ref.current)}
          className={btnSecondary}
        >
          <Printer className="h-4 w-4" />
          Print
        </button>
        <button
          type="button"
          onClick={() => ref.current && onExportPdf(ref.current)}
          disabled={isExportingPdf}
          className={btnSecondary}
        >
          <FileDown className="h-4 w-4" />
          {isExportingPdf ? 'Exporting…' : 'Export PDF'}
        </button>
      </div>
    </div>
  );
}

function PaymentDetailExport({ payment }: { payment: Payment }) {
  const ref = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const balance = n(payment.totalDue) - n(payment.discount) - n(payment.amountPaid);
  const hasCarriedOver = n(payment.balanceCarriedOver) > 0;

  const handlePrint = () => {
    if (!ref.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const styles = `
      body { font-family: Georgia, serif; padding: 24px; color: #000; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 8px; text-align: left; }
      .border-b-2 { border-bottom: 2px solid #1e293b; }
      .border-slate-200 { border-color: #e2e8f0; }
      .text-slate-600 { color: #475569; }
      .text-amber-700 { color: #b45309; }
      .text-red-600 { color: #dc2626; }
      .text-green-700 { color: #15803d; }
    `;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Payment Detail</title><style>${styles}</style></head><body>${ref.current.outerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  const handleExport = async () => {
    if (!ref.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgW, Math.min(imgH, pageH));
      if (imgH > pageH) pdf.addPage();
      pdf.save(`payment-detail-${(payment.Student?.name ?? 'payment').replace(/\s+/g, '-')}-${MONTHS[payment.month - 1]}-${payment.year}.pdf`);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Export failed', text: 'Failed to export PDF.' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div
        ref={ref}
        className="pay-detail-export fixed left-[-9999px] top-0 z-[-1] w-[210mm] bg-white p-8 text-black"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        <div className="mb-8 border-b-2 border-slate-800 pb-4">
          <h1 className="text-2xl font-bold tracking-tight">Madrasah Academic System</h1>
          <p className="mt-1 text-sm text-slate-600">Payment Detail</p>
        </div>
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Student & Period</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 font-medium text-slate-600">Student</td>
                <td className="py-1">{payment.Student?.name ?? '—'}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium text-slate-600">Period</td>
                <td className="py-1">{MONTHS[payment.month - 1]} {payment.year}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Payment Summary</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-2 font-medium text-slate-600">Monthly fee</td>
                <td className="py-2 text-right">{n(payment.feeAmount).toLocaleString()} KES</td>
              </tr>
              {hasCarriedOver && (
                <tr>
                  <td className="py-2 font-medium text-amber-700">Previous balance</td>
                  <td className="py-2 text-right">{n(payment.balanceCarriedOver).toLocaleString()} KES</td>
                </tr>
              )}
              <tr>
                <td className="py-2 font-medium text-slate-600">Total due</td>
                <td className="py-2 text-right font-semibold">{n(payment.totalDue).toLocaleString()} KES</td>
              </tr>
              {n(payment.discount) > 0 && (
                <tr>
                  <td className="py-2 font-medium text-slate-600">Discount</td>
                  <td className="py-2 text-right text-emerald-600">-{n(payment.discount).toLocaleString()} KES</td>
                </tr>
              )}
              <tr>
                <td className="py-2 font-medium text-slate-600">Amount paid</td>
                <td className="py-2 text-right">{n(payment.amountPaid).toLocaleString()} KES</td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-slate-600">Balance</td>
                <td className={`py-2 text-right font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-700'}`}>
                  {balance.toLocaleString()} KES
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold">Receipts</h2>
          {!payment.receipts || payment.receipts.length === 0 ? (
            <p className="text-sm text-slate-600">No receipts yet.</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-slate-800">
                  <th className="py-2 text-left font-semibold">Receipt #</th>
                  <th className="py-2 text-left font-semibold">Date</th>
                  <th className="py-2 text-left font-semibold">Notes</th>
                  <th className="py-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payment.receipts.map((r) => (
                  <tr key={r.id} className="border-b border-slate-200">
                    <td className="py-2">{r.receiptNumber || '—'}</td>
                    <td className="py-2">{typeof r.date === 'string' ? r.date.slice(0, 10) : r.date}</td>
                    <td className="py-2">{r.notes || '—'}</td>
                    <td className="py-2 text-right">{n(r.amount).toLocaleString()} KES</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-800 font-semibold">
                  <td colSpan={3} className="py-2">Total paid</td>
                  <td className="py-2 text-right">{n(payment.amountPaid).toLocaleString()} KES</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
        <p className="mt-8 text-center text-xs text-slate-500">Generated from Madrasah Academic System</p>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={handlePrint} className={btnSecondary}>
          <Printer className="h-4 w-4" />
          Print
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className={btnSecondary}
        >
          <FileDown className="h-4 w-4" />
          {exporting ? 'Exporting…' : 'Export PDF'}
        </button>
      </div>
    </>
  );
}

export function PaymentDetailContent({ paymentId }: { paymentId: string }) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [receiptModal, setReceiptModal] = useState<ReceiptRow | 'add' | null>(null);
  const [receiptAmount, setReceiptAmount] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [receiptNotes, setReceiptNotes] = useState('');
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [balanceDueDate, setBalanceDueDate] = useState('');
  const [appointmentSaving, setAppointmentSaving] = useState(false);

  const loadPayment = () => {
    if (!paymentId) return;
    fetch(`/api/payments/${paymentId}`)
      .then((r) => r.json())
      .then((data) => {
        setPayment(data);
        const d = data?.balanceDueDate;
        setBalanceDueDate(d ? (typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)) : '');
      })
      .catch(() => setPayment(null))
      .finally(() => setLoading(false));
  };

  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentId || !payment) return;
    setAppointmentSaving(true);
    fetch(`/api/payments/${paymentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        balanceDueDate: balanceDueDate.trim() || null,
      }),
    })
      .then((r) => {
        if (r.ok) return r.json();
        throw new Error('Failed to save');
      })
      .then((data) => {
        setPayment(data);
        const d = data?.balanceDueDate;
        setBalanceDueDate(d ? (typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)) : '');
        Swal.fire({ icon: 'success', title: 'Saved', text: 'Appointment date for balance updated.' });
      })
      .catch(() => Swal.fire({ icon: 'error', title: 'Error', text: 'Could not save appointment date.' }))
      .finally(() => setAppointmentSaving(false));
  };

  useEffect(() => {
    loadPayment();
    fetch('/api/auth/permissions')
      .then((r) => r.json())
      .then((data) => {
        const perms = Array.isArray(data?.permissions) ? data.permissions : [];
        setCanManage(perms.includes('payments.manage'));
      })
      .catch(() => setCanManage(false));
  }, [paymentId]);

  const handlePrint = (el: HTMLElement) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const styles = `
      body { font-family: system-ui, sans-serif; padding: 24px; color: #000; }
      .receipt-print-content { max-width: 400px; }
      h2 { border-bottom: 2px solid #000; padding-bottom: 8px; font-size: 18px; }
      p { margin: 4px 0; font-size: 14px; }
      .text-amber-700 { color: #b45309; }
      .text-gray-600 { color: #4b5563; font-size: 12px; }
      .mt-6 { margin-top: 24px; }
      .border-t { border-top: 1px solid #e5e7eb; }
      .pt-4 { padding-top: 16px; }
    `;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Receipt</title><style>${styles}</style></head>
        <body>${el.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleExportPdf = async (el: HTMLElement) => {
    setPdfExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgW, Math.min(imgH, pageH));
      if (imgH > pageH) pdf.addPage();
      pdf.save(`receipt-${Date.now()}.pdf`);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Export failed', text: 'Failed to export PDF.' });
    } finally {
      setPdfExporting(false);
    }
  };

  const handleAddReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment || !receiptAmount || parseFloat(receiptAmount) <= 0) return;
    setReceiptLoading(true);
    fetch(`/api/payments/${payment.id}/receipts`, {
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
          loadPayment();
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

  if (loading || !payment) {
    return (
      <div className="space-y-6">
        <Link href="/payments" className={btnSecondary}>
          <ArrowLeft className="h-4 w-4" />
          Back to payments
        </Link>
        {loading ? (
          <>
            <div className="h-32 animate-pulse rounded-2xl bg-muted" />
            <TableSkeleton rows={4} cols={4} />
          </>
        ) : (
          <p className="text-muted-foreground">Payment not found.</p>
        )}
      </div>
    );
  }

  const balance = n(payment.totalDue) - n(payment.discount) - n(payment.amountPaid);
  const hasCarriedOver = n(payment.balanceCarriedOver) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/payments" className={btnSecondary}>
          <ArrowLeft className="h-4 w-4" />
          Back to payments
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <PaymentDetailExport payment={payment} />
          {canManage && balance > 0 && (
            payment.canAddReceipt !== false ? (
              <button
                type="button"
                onClick={() => setReceiptModal('add')}
                className={btnPrimary}
              >
                <Plus className="h-4 w-4" />
                Add receipt
              </button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Balance carried to next month. Add receipts to the next month&apos;s payment instead.
              </p>
            )
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Payment detail</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {payment.Student?.name ?? 'Student'} – {MONTHS[payment.month - 1]} {payment.year}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Monthly fee</p>
            <p className="font-medium">{n(payment.feeAmount).toLocaleString()} KES</p>
          </div>
          {hasCarriedOver && (
            <div>
              <p className="text-sm text-amber-600">Previous balance</p>
              <p className="font-medium text-amber-600">{n(payment.balanceCarriedOver).toLocaleString()} KES</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Total due</p>
            <p className="font-medium">{n(payment.totalDue).toLocaleString()} KES</p>
          </div>
          {n(payment.discount) > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">Discount</p>
              <p className="font-medium text-emerald-600">-{n(payment.discount).toLocaleString()} KES</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Amount paid</p>
            <p className="font-medium">{n(payment.amountPaid).toLocaleString()} KES</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className={`font-medium ${balance > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
              {balance.toLocaleString()} KES
            </p>
          </div>
        </div>

        {balance > 0 && (
          <div className="mt-6 rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-800/50 dark:bg-amber-900/10">
            <h3 className="flex items-center gap-2 font-medium text-amber-900 dark:text-amber-100">
              <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Appointment for balance
            </h3>
            <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/80">
              Remaining {balance.toLocaleString()} KES — set when the parent/student should pay.
            </p>
            {canManage ? (
              <form onSubmit={handleSaveAppointment} className="mt-4 flex flex-wrap items-end gap-3">
                <div className="min-w-[200px]">
                  <label htmlFor="balanceDueDate" className="mb-1.5 block text-sm font-medium text-foreground">
                    Pay by date
                  </label>
                  <input
                    id="balanceDueDate"
                    type="date"
                    value={balanceDueDate}
                    onChange={(e) => setBalanceDueDate(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                  />
                </div>
                <button
                  type="submit"
                  disabled={appointmentSaving}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-600 px-5 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  {appointmentSaving ? 'Saving…' : 'Save date'}
                </button>
              </form>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {payment.balanceDueDate ? (
                  <>
                    <span className="inline-flex items-center gap-2 rounded-lg bg-amber-200/80 px-3 py-1.5 text-sm font-medium text-amber-900 dark:bg-amber-800/50 dark:text-amber-100">
                      <Calendar className="h-4 w-4" />
                      Pay by {typeof payment.balanceDueDate === 'string' ? payment.balanceDueDate.slice(0, 10) : new Date(payment.balanceDueDate).toISOString().slice(0, 10)}
                    </span>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No pay-by date set.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="font-semibold">Receipts</h3>
        {!payment.receipts || payment.receipts.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No receipts yet.</p>
        ) : (
          <div className="mt-4">
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="whitespace-nowrap">Receipt #</TableHead>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                    <TableHead className="text-center whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payment.receipts.map((r, i) => (
                    <TableRow key={r.id} className={i % 2 === 1 ? 'bg-muted/5' : ''}>
                      <TableCell>{r.receiptNumber || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap">{typeof r.date === 'string' ? r.date.slice(0, 10) : r.date}</TableCell>
                      <TableCell className="text-right">{n(r.amount).toLocaleString()} KES</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setReceiptModal(r)}
                          className="inline-flex items-center gap-1 rounded-lg border border-input px-2 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                          <Receipt className="h-3 w-3" />
                          Print / PDF
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        )}
      </div>

      {receiptModal && (
        <>
          {receiptModal !== 'add' && 'id' in receiptModal ? (
            <>
              <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setReceiptModal(null)} aria-hidden="true" />
              <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-xl">
                <ReceiptPrintable
                  payment={payment}
                  receipt={receiptModal as ReceiptRow}
                  onPrint={handlePrint}
                  onExportPdf={handleExportPdf}
                  isExportingPdf={pdfExporting}
                />
                <button
                  type="button"
                  onClick={() => setReceiptModal(null)}
                  className={`mt-4 ${btnSecondary}`}
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setReceiptModal(null)} aria-hidden="true" />
              <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-xl">
                <h2 className="text-lg font-semibold">Add receipt</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Balance due: {balance.toLocaleString()} KES
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
        </>
      )}
    </div>
  );
}
