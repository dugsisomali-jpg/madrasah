'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { Printer, FileDown, Loader2, CheckCircle2, Receipt, Table as TableIcon, ChevronLeft } from 'lucide-react';
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
  allMonths: { month: number; year: number }[];
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ReceiptPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = use(params);
  const router = useRouter();
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
    window.print();
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
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-semibold text-slate-500 animate-pulse uppercase tracking-[0.2em] text-xs">Generating Pivot Summary...</p>
      </div>
    );
  }

  if (!summary) return <div className="p-10 text-center font-bold text-destructive">Failed to load receipt details.</div>;

  return (
    <div className="min-h-screen bg-slate-100/50 p-4 md:p-8 print:p-0 print:bg-white overflow-y-auto">
      {/* Action Bar */}
      <div className="mx-auto max-w-4xl mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Payments
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            PDF Export
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-xl hover:bg-slate-800 transition-all active:scale-95"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>
        </div>
      </div>

      {/* Receipt Frame */}
      <div className="mx-auto max-w-4xl print:max-w-none print:shadow-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] border border-slate-100 bg-white p-2 print:p-0 print:border-none overflow-hidden">
        <div 
          ref={printRef}
          className="bg-white p-10 md:p-14 print:p-8 text-slate-900 rounded-[2rem] print:rounded-none"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-4 border-slate-100 pb-10 mb-12 gap-6 sm:gap-0">
            <div className="branding">
              <div className="flex items-center gap-4 mb-3">
                <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-200">
                  <Receipt className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tighter text-slate-900 leading-tight">Official Receipt</h1>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-0.5">Payment Confirmation</p>
                </div>
              </div>
              <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest sm:ml-16">Madrasah Academic Intelligence</p>
            </div>
            <div className="receipt-meta text-left sm:text-right">
              <div className="mb-6 sm:mb-8">
                <p className="text-[10px] font-black text-slate-300 uppercase mb-1 tracking-widest">Receipt ID</p>
                <p className="text-lg font-mono font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-lg">#{summary.receiptNumber || summary.batchId.slice(-6).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase mb-1 tracking-widest">Issue Date</p>
                <p className="text-base font-bold text-slate-900">{new Date(summary.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-14">
            <div className="info-card bg-slate-50/50 border-2 border-slate-50 p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100/50 rounded-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-500" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 relative">Billing To</h3>
              <p className="text-2xl font-black text-slate-900 mb-4 relative">{summary.parentName}</p>
              {summary.notes && (
                <div className="border-t border-slate-200 mt-5 pt-5 relative">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Narration</h4>
                  <p className="text-[13px] text-slate-600 italic leading-relaxed font-medium bg-white/50 p-3 rounded-xl border border-slate-100">"{summary.notes}"</p>
                </div>
              )}
            </div>
            <div className="info-card bg-slate-900 p-8 rounded-3xl flex flex-col justify-center text-white shadow-xl shadow-slate-200 group relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-12 translate-y-12" />
              <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 text-center sm:text-left">Settlement Amount</h3>
              <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                <span className="text-5xl font-black tracking-tighter">{summary.totalAmount.toLocaleString()}</span>
                <span className="text-lg font-bold text-white/40 uppercase">KES</span>
              </div>
              <div className="mt-6 flex items-center gap-2 text-[11px] font-extrabold text-emerald-400 bg-white/5 px-4 py-2 rounded-xl w-fit sm:mx-0 mx-auto">
                <CheckCircle2 className="h-4 w-4" /> Transaction Fully Synchronized
              </div>
            </div>
          </div>

          {/* Pivot Table */}
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center shadow-sm">
                <TableIcon className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em]">Institutional Settlement Distribution</span>
            </div>
            <div className="overflow-x-auto rounded-[2rem] border-2 border-slate-50 shadow-sm bg-white">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="py-6 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Student Name</th>
                    {summary.allMonths.map((m, i) => (
                      <th key={i} className="py-6 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right font-mono">
                        {MONTHS[m.month - 1]} {m.year % 100}
                      </th>
                    ))}
                    <th className="py-6 px-8 text-[11px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 text-right bg-slate-50/70">Aggregate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {summary.students.map((student, sIdx) => (
                    <tr key={sIdx} className="hover:bg-slate-50/20 transition-colors">
                      <td className="py-6 px-8 font-black text-slate-900 border-r-2 border-slate-50">{student.studentName}</td>
                      {summary.allMonths.map((m, mIdx) => {
                        const paid = student.periods.find(p => p.month === m.month && p.year === m.year);
                        return (
                          <td key={mIdx} className="py-6 px-4 text-right font-mono text-sm font-bold text-slate-500">
                            {paid ? paid.amount.toLocaleString() : <span className="text-slate-200">—</span>}
                          </td>
                        );
                      })}
                      <td className="py-6 px-8 text-right font-black text-slate-900 bg-slate-50/30 italic text-base">
                        {student.amountPaid.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white border-t-4 border-slate-100">
                    <td className="py-6 px-8 text-[12px] font-black uppercase tracking-[0.2em] rounded-bl-[1.8rem]">Pivot Liquidation</td>
                    {summary.allMonths.map((m, mIdx) => {
                      const monthTotal = summary.students.reduce((sum, s) => {
                        const p = s.periods.find(px => px.month === m.month && px.year === m.year);
                        return sum + (p ? p.amount : 0);
                      }, 0);
                      return (
                        <td key={mIdx} className="py-6 px-4 text-right font-mono text-xs font-bold text-white/50">
                          {monthTotal > 0 ? monthTotal.toLocaleString() : '—'}
                        </td>
                      );
                    })}
                    <td className="py-6 px-8 text-right font-black text-white text-2xl tracking-tighter rounded-br-[1.8rem]">
                      {summary.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="mt-16 pb-6 text-center">
            <div className="inline-block py-3 px-10 rounded-2xl border-2 border-slate-50 bg-slate-50/20 mb-6">
              <p className="text-[13px] font-bold text-slate-500 italic">"The above sum of <span className="text-slate-900 font-extrabold not-italic">{summary.totalAmount.toLocaleString()} KES</span> has been successfully accounted for in the institutional ledger."</p>
            </div>
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mt-2">Madrasah Academic Ledger Authentication</div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .min-h-screen { background: transparent !important; padding: 0 !important; }
          .mx-auto { max-width: none !important; margin: 0 !important; }
          .shadow-2xl { shadow: none !important; }
          .rounded-[2.5rem] { border-radius: 0 !important; border: none !important; }
          .p-2 { padding: 0 !important; }
          .print\:p-8 { padding: 2rem !important; }
          .rounded-[2rem] { border-radius: 0 !important; }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  );
}
