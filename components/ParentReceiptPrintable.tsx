'use client';

import { useRef, useState, useEffect } from 'react';
import { Printer, FileDown, Loader2, CheckCircle2, Receipt } from 'lucide-react';
import Swal from 'sweetalert2';

type StudentSummary = {
  studentName: string;
  feePerMonth: number;
  totalDue: number;
  discount: number;
  amountPaid: number;
  periods: { month: number; year: number; amount: number }[];
};

type ParentSummary = {
  batchId: string;
  receiptNumber?: string;
  date: string;
  totalAmount: number;
  parentName: string;
  notes?: string;
  students: StudentSummary[];
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ParentReceiptPrintable({ batchId, onClose }: { batchId: string; onClose: () => void }) {
  const [summary, setSummary] = useState<ParentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!batchId) return;
    setLoading(true);
    fetch(`/api/receipts/parent-summary?batchId=${batchId}`)
      .then(r => r.json())
      .then(data => setSummary(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [batchId]);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = `
      body { font-family: 'Georgia', serif; padding: 40px; color: #0f172a; line-height: 1.5; }
      .header { border-bottom: 2px solid #e2e8f0; margin-bottom: 30px; padding-bottom: 20px; }
      .header h1 { margin: 0; font-size: 28px; color: #1e293b; }
      .header p { margin: 5px 0 0; color: #64748b; font-size: 14px; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
      .info-box h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 8px; }
      .info-box p { font-size: 16px; font-weight: 600; margin: 0; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
      th { text-align: left; padding: 12px; border-bottom: 2px solid #f1f5f9; color: #64748b; font-size: 12px; text-transform: uppercase; }
      td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
      .amount { text-align: right; }
      .total-row { background: #f8fafc; font-weight: 700; font-size: 16px; }
      .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; pt-20px; }
      .student-section { margin-top: 20px; }
      .student-header { background: #f1f5f9; padding: 8px 12px; font-weight: 700; font-size: 14px; margin-bottom: 10px; }
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${summary?.receiptNumber || 'Bulk'}</title>
          <style>${styles}</style>
        </head>
        <body>
          ${printRef.current.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleExportPdf = async () => {
    if (!printRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgW, imgH);
      pdf.save(`receipt-${summary?.receiptNumber || 'parent'}-${Date.now()}.pdf`);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Export failed' });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Preparing your premium receipt...</p>
      </div>
    );
  }

  if (!summary) return <div>Failed to load receipt details.</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-1 shadow-2xl backdrop-blur-xl dark:bg-slate-900/50">
        <div 
          ref={printRef}
          className="bg-white p-8 text-slate-900 rounded-2xl md:p-12"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <div className="mb-10 flex flex-col justify-between gap-6 border-b border-slate-100 pb-10 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <Receipt className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">Official Receipt</h1>
              </div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Madrasah Academic System</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Receipt Number</p>
              <p className="text-lg font-mono font-bold text-primary">#{summary.receiptNumber || summary.batchId.slice(-6).toUpperCase()}</p>
              <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-tighter">Issue Date</p>
              <p className="text-sm font-bold">{new Date(summary.date).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 mb-12 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Paid By (Parent)</p>
              <p className="text-lg font-bold text-slate-900">{summary.parentName}</p>
              {summary.notes && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                  <p className="text-xs text-slate-600 italic">"{summary.notes}"</p>
                </div>
              )}
            </div>
            <div className="rounded-2xl bg-primary/5 p-6 border border-primary/10 flex flex-col justify-center">
              <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1">Total Amount Paid</p>
              <p className="text-3xl font-black text-primary tracking-tighter">
                {summary.totalAmount.toLocaleString()} <span className="text-sm font-bold text-primary/60">KES</span>
              </p>
              <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
                <CheckCircle2 className="h-3 w-3" /> Fully Credited
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Payment Breakdown</p>
            {summary.students.map((student, idx) => (
              <div key={idx} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-700">{student.studentName}</span>
                  <span className="text-xs font-bold text-primary bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                    {student.amountPaid.toLocaleString()} KES
                  </span>
                </div>
                <div className="p-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-400">
                        <th className="pb-3 pt-0 font-black text-[10px] uppercase tracking-wider">Paid Period</th>
                        <th className="pb-3 pt-0 text-right font-black text-[10px] uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600">
                      {student.periods.map((p, pIdx) => (
                        <tr key={pIdx}>
                          <td className="py-2 font-medium">{MONTHS[p.month - 1]} {p.year}</td>
                          <td className="py-2 text-right font-mono font-semibold">{p.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-100">
                        <td className="pt-3 font-bold text-slate-900">Student Total</td>
                        <td className="pt-3 text-right font-black text-slate-900 font-mono italic">{student.amountPaid.toLocaleString()} KES</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <div className="inline-block p-4 rounded-full bg-slate-50 border border-slate-100 mb-6 group transition-all hover:bg-primary/5 hover:border-primary/20">
              <p className="text-sm font-bold text-slate-500 group-hover:text-primary">Thank you for your timely contribution</p>
            </div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">Generated by Madrasah Academic Intelligence</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handlePrint}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-black text-white shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95 dark:shadow-none"
        >
          <Printer className="h-5 w-5" />
          Print Receipt
        </button>
        <button
          onClick={handleExportPdf}
          disabled={exporting}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white border-2 border-slate-200 px-6 py-4 text-sm font-black text-slate-900 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileDown className="h-5 w-5" />}
          Export PDF
        </button>
        <button
          onClick={onClose}
          className="flex-none rounded-2xl bg-slate-100 px-6 py-4 text-sm font-black text-slate-600 transition-all hover:bg-slate-200 active:scale-95"
        >
          Close
        </button>
      </div>
    </div>
  );
}
