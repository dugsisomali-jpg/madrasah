'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Printer, 
  FileDown, 
  Loader2, 
  CheckCircle2, 
  Receipt, 
  User, 
  ChevronLeft, 
  TrendingUp, 
  AlertCircle,
  FileText,
  Calendar
} from 'lucide-react';
import Swal from 'sweetalert2';

type ReceiptInfo = {
  id: string;
  amount: number;
  date: string;
  receiptNumber: string;
};

type PaymentInfo = {
  id: string;
  month: number;
  year: number;
  feeAmount: number;
  totalDue: number;
  discount: number;
  amountPaid: number;
  balance: number;
  balanceDueDate: string | null;
  receipts: ReceiptInfo[];
};

type StudentStatement = {
  studentId: string;
  studentName: string;
  currentFee: number;
  payments: PaymentInfo[];
  summary: {
    totalPaid: number;
    totalDiscount: number;
    currentBalance: number;
  };
};

type ParentStatement = {
  parentName: string;
  generatedAt: string;
  students: StudentStatement[];
  grandSummary: {
    totalPaid: number;
    totalBalance: number;
  };
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function StatementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [statement, setStatement] = useState<ParentStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/users/parents/${id}/statement`)
      .then(r => r.json())
      .then(data => setStatement(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

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
      pdf.save(`statement-${statement?.parentName || 'parent'}-${Date.now()}.pdf`);
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
        <p className="font-semibold text-slate-500 animate-pulse uppercase tracking-[0.2em] text-xs font-mono">Compiling Ledger Data...</p>
      </div>
    );
  }

  if (!statement) return <div className="p-10 text-center font-bold text-destructive">Failed to load statement details.</div>;

  return (
    <div className="min-h-screen bg-slate-100/30 p-4 md:p-8 print:p-0 print:bg-white overflow-y-auto custom-scrollbar">
      {/* Action Bar */}
      <div className="mx-auto max-w-5xl mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-6 py-3 text-xs font-black text-slate-900 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 uppercase tracking-widest"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Export PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-xs font-black text-white shadow-xl hover:bg-slate-800 transition-all active:scale-95 uppercase tracking-widest"
          >
            <Printer className="h-4 w-4" />
            Print Statement
          </button>
        </div>
      </div>

      {/* Statement Frame */}
      <div className="mx-auto max-w-5xl print:max-w-none print:shadow-none shadow-2xl shadow-slate-200/40 rounded-[3rem] border border-slate-100 bg-white p-2 print:p-0 print:border-none overflow-hidden">
        <div 
          ref={printRef}
          className="bg-white p-12 md:p-16 print:p-8 text-slate-900 rounded-[2.8rem] print:rounded-none"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-8 border-slate-50 pb-12 mb-16 gap-8">
            <div className="branding">
              <div className="flex items-center gap-5 mb-4">
                <div className="h-14 w-14 flex items-center justify-center rounded-[1.25rem] bg-slate-900 text-white shadow-2xl shadow-slate-900/20">
                  <FileText className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-black tracking-tighter text-slate-900 leading-none">Statement of Account</h1>
                  <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] mt-2">Financial Integrity Report</p>
                </div>
              </div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest sm:ml-20">Madrasah Academic Intelligence</p>
            </div>
            <div className="receipt-meta text-left sm:text-right">
              <div className="mb-8">
                <p className="text-[10px] font-black text-slate-300 uppercase mb-2 tracking-[0.2em]">Statement For</p>
                <div className="flex items-center gap-2 sm:justify-end">
                   <User className="h-4 w-4 text-slate-400" />
                   <p className="text-xl font-black text-slate-900">{statement.parentName}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase mb-2 tracking-[0.2em]">Generated On</p>
                <div className="flex items-center gap-2 sm:justify-end">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <p className="text-sm font-bold text-slate-600">{new Date(statement.generatedAt).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grand Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
             <div className="p-8 rounded-[2rem] bg-emerald-50 border-2 border-emerald-100 flex flex-col justify-between group transition-all">
                <div className="flex items-center justify-between mb-6">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">Liquidated</span>
                </div>
                <div>
                    <p className="text-4xl font-black text-emerald-900 tracking-tighter mb-1">{statement.grandSummary.totalPaid.toLocaleString()}</p>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Credit Received</p>
                </div>
             </div>
             
             <div className="p-8 rounded-[2rem] bg-rose-50 border-2 border-rose-100 flex flex-col justify-between group transition-all">
                <div className="flex items-center justify-between mb-6">
                    <AlertCircle className="h-6 w-6 text-rose-600 animate-pulse" />
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-100 px-3 py-1 rounded-full">Outstanding</span>
                </div>
                <div>
                    <p className="text-4xl font-black text-rose-900 tracking-tighter mb-1">{statement.grandSummary.totalBalance.toLocaleString()}</p>
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Aggregate Liability</p>
                </div>
             </div>

             <div className="p-8 rounded-[2rem] bg-slate-900 flex flex-col justify-between group transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-16 -translate-y-16" />
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <CheckCircle2 className="h-6 w-6 text-white/50" />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest border border-white/20 px-3 py-1 rounded-full">Verified</span>
                </div>
                <div className="relative z-10">
                    <p className="text-4xl font-black text-white tracking-tighter mb-1">Active</p>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Account Status</p>
                </div>
             </div>
          </div>

          {/* Student Ledgers */}
          <div className="space-y-24">
            {statement.students.map((student, sIdx) => (
              <div key={sIdx} className="student-section">
                <div className="flex items-center gap-4 mb-8 border-l-4 border-slate-900 pl-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{student.studentName}</h2>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Student Ledger Summary • Monthly Commitment: {student.currentFee.toLocaleString()} KES</p>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-[2rem] border-2 border-slate-50 shadow-sm bg-white overflow-hidden">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="py-6 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 italic">Bill Period</th>
                        <th className="py-6 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Fee Amnt</th>
                        <th className="py-6 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Discount</th>
                        <th className="py-6 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Amt Paid</th>
                        <th className="py-6 px-8 text-[11px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 text-right bg-slate-50/70">Arrears</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-mono text-sm uppercase">
                      {student.payments.map((p, pIdx) => (
                        <tr key={pIdx} className="hover:bg-slate-50/20 transition-colors group">
                          <td className="py-6 px-8 font-black text-slate-900 border-r-2 border-slate-50">
                            {MONTHS[p.month - 1]} {p.year}
                          </td>
                          <td className="py-6 px-4 text-right font-bold text-slate-500">{p.feeAmount.toLocaleString()}</td>
                          <td className="py-6 px-4 text-right font-bold text-slate-400">{p.discount > 0 ? p.discount.toLocaleString() : '—'}</td>
                          <td className="py-6 px-4 text-right font-black text-slate-900">
                             <div>
                                {p.amountPaid.toLocaleString()}
                                {p.receipts.length > 0 && (
                                    <div className="flex flex-col gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity print:opacity-100">
                                        {p.receipts.map(r => (
                                            <span key={r.id} className="text-[9px] font-black text-emerald-600 bg-emerald-50/50 px-2 py-0.5 rounded-lg w-fit ml-auto">
                                                REC#{r.receiptNumber || r.id.slice(-4).toUpperCase()}
                                            </span>
                                        ))}
                                    </div>
                                )}
                             </div>
                          </td>
                          <td className={`py-6 px-8 text-right font-black bg-slate-50/30 ${p.balance > 1 ? 'text-rose-600' : 'text-slate-300 italic'}`}>
                            {p.balance > 1 ? p.balance.toLocaleString() : 'Settled'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-100/50">
                            <td className="py-6 px-8 text-xs font-black text-slate-400 uppercase tracking-widest">Student Balances</td>
                            <td className="py-6 px-4"></td>
                            <td className="py-6 px-4 text-right font-black text-slate-400 text-xs italic">{student.summary.totalDiscount > 0 ? `Total Disc: ${student.summary.totalDiscount.toLocaleString()}` : ''}</td>
                            <td className="py-6 px-4 text-right font-black text-emerald-700 text-sm italic">Paid: {student.summary.totalPaid.toLocaleString()}</td>
                            <td className="py-6 px-8 text-right font-black text-rose-700 text-lg tracking-tighter bg-rose-50/30">
                                {student.summary.currentBalance.toLocaleString()} <span className="text-[10px] uppercase ml-1">KES</span>
                            </td>
                        </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-32 border-t-8 border-slate-900 pt-16 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] mb-4">Official Disclaimer</h4>
                <p className="text-xs text-slate-500 leading-[1.8] font-medium italic pr-12">
                   "This document serves as an official institutional statement of account. All figures are derived from the central ledger and verified as of the generation timestamp. Any discrepancies should be reported to the financial department within 7 business days."
                </p>
            </div>
            <div className="flex flex-col items-center justify-end sm:items-end">
                <div className="w-64 border-b-2 border-slate-900 mb-4 h-16 flex items-end justify-center">
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 italic">Verified Institutional Signature</p>
                </div>
                <div className="text-[13px] font-black text-slate-900 uppercase tracking-[0.2em]">Authorized Accounts Officer</div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1 italic">Madrasah Academic Intelligence Ledger</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .min-h-screen { background: transparent !important; padding: 0 !important; }
          .mx-auto { max-width: none !important; margin: 0 !important; }
          .shadow-2xl { shadow: none !important; }
          .rounded-\[3rem\] { border-radius: 0 !important; border: none !important; }
          .p-2 { padding: 0 !important; }
          .print\:p-8 { padding: 2rem !important; }
          .rounded-\[2\.8rem\] { border-radius: 0 !important; }
          @page { margin: 1cm; size: a4; }
          .student-section { page-break-inside: avoid; margin-bottom: 4rem !important; }
        }
      `}</style>
    </div>
  );
}
