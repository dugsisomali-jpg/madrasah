'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Printer, 
  FileDown, 
  Loader2, 
  User, 
  ChevronLeft, 
  FileText,
  Calendar,
  ArrowRight
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
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const [statement, setStatement] = useState<ParentStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);

    fetch(`/api/users/parents/${id}/statement?${qs.toString()}`)
      .then(r => r.json())
      .then(data => setStatement(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id, from, to]);

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
        <p className="font-semibold text-slate-500 animate-pulse uppercase tracking-[0.2em] text-xs font-mono">Generating Pivot Report...</p>
      </div>
    );
  }

  if (!statement) return <div className="p-10 text-center font-bold text-destructive">Failed to load statement details.</div>;

  // Generate all month keys between 'from' and 'to'
  const sortedMonthKeys: string[] = [];
  if (from && to) {
    let [currY, currM] = from.split('-').map(Number);
    const [endY, endM] = to.split('-').map(Number);
    
    while (currY < endY || (currY === endY && currM <= endM)) {
      sortedMonthKeys.push(`${currY}-${String(currM).padStart(2, '0')}`);
      currM++;
      if (currM > 12) {
        currM = 1;
        currY++;
      }
    }
  } else {
    // Fallback if no range: extract unique months from existing data
    const allMonthsSet = new Set<string>();
    statement.students.forEach(s => {
      s.payments.forEach(p => {
        allMonthsSet.add(`${p.year}-${String(p.month).padStart(2, '0')}`);
      });
    });
    sortedMonthKeys.push(...Array.from(allMonthsSet).sort());
  }

  const monthLabels = sortedMonthKeys.map(k => {
    const [y, m] = k.split('-');
    return `${MONTHS[parseInt(m) - 1]} ${y.slice(-2)}`;
  });

  return (
    <div className="min-h-screen bg-slate-100/30 p-4 md:p-8 print:p-0 print:bg-white overflow-y-auto custom-scrollbar">
      {/* Action Bar */}
      <div className="mx-auto max-w-7xl mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
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
      <div className="mx-auto max-w-7xl print:max-w-none print:shadow-none shadow-2xl shadow-slate-200/40 border border-slate-100 bg-white p-2 print:p-0 print:border-none">
        <div 
          ref={printRef}
          className="bg-white p-10 md:p-14 print:p-8 text-slate-900"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-4 border-slate-900 pb-10 mb-12 gap-8">
            <div className="branding">
              <div className="flex items-center gap-5 mb-4">
                <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/10">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tighter text-slate-900 leading-none uppercase">Account Statement</h1>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5">Consolidated Student Ledger</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:ml-16">
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Period:</span>
                 <div className="flex items-center gap-2 text-sm font-black text-slate-600 uppercase tracking-tighter">
                    {from ? from : 'All Time'}
                    <ArrowRight className="h-3 w-3 text-slate-300" />
                    {to ? to : 'Present'}
                 </div>
              </div>
            </div>
            <div className="receipt-meta text-left sm:text-right">
              <div className="mb-4">
                <p className="text-[9px] font-black text-slate-300 uppercase mb-1 tracking-[0.2em]">Parent Name</p>
                <div className="flex items-center gap-2 sm:justify-end">
                   <User className="h-3.5 w-3.5 text-slate-400" />
                   <p className="text-xl font-black text-slate-900 uppercase tracking-tight">{statement.parentName}</p>
                </div>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-300 uppercase mb-1 tracking-[0.2em]">Generated On</p>
                <div className="flex items-center gap-2 sm:justify-end">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500">{new Date(statement.generatedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Regular Full-Bordered Table */}
          <div className="overflow-x-auto mb-12">
            <table className="w-full text-left border-collapse border border-slate-900 min-w-[800px]">
              <thead>
                <tr className="bg-slate-100">
                  <th className="py-4 px-6 text-[11px] font-black text-slate-900 uppercase tracking-widest border border-slate-900">Student Name</th>
                  {monthLabels.map((month, mIdx) => (
                    <th key={mIdx} className="py-4 px-3 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right border border-slate-900 whitespace-nowrap">
                      {month}
                    </th>
                  ))}
                  <th className="py-4 px-6 text-[11px] font-black text-slate-900 uppercase tracking-widest text-right border border-slate-900 bg-slate-200">Total Arrears</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs uppercase text-slate-900">
                {statement.students.map((student, sIdx) => {
                  return (
                    <tr key={sIdx}>
                      <td className="py-4 px-6 font-black border border-slate-900 bg-slate-50/30">
                        {student.studentName}
                      </td>
                      {sortedMonthKeys.map((monthKey, mkIdx) => {
                        const [y, m] = monthKey.split('-').map(Number);
                        const payment = student.payments.find(p => p.year === y && p.month === m);
                        const balance = payment ? payment.balance : 0;
                        
                        return (
                          <td key={mkIdx} className="py-4 px-3 text-right border border-slate-900 font-bold">
                            {balance > 1 ? balance.toLocaleString() : '—'}
                          </td>
                        );
                      })}
                      <td className="py-4 px-6 text-right font-black border border-slate-900 bg-slate-100 text-sm">
                        {student.summary.currentBalance.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="font-mono">
                 <tr>
                    <td className="py-5 px-6 text-[11px] font-black text-slate-900 uppercase tracking-widest italic border border-slate-900 bg-slate-100">Consolidated Summary</td>
                    {sortedMonthKeys.map((monthKey, mkIdx) => {
                        const [y, m] = monthKey.split('-').map(Number);
                        const monthTotal = statement.students.reduce((sum, s) => {
                            const p = s.payments.find(pm => pm.year === y && pm.month === m);
                            return sum + (p ? p.balance : 0);
                        }, 0);
                        return (
                            <td key={mkIdx} className="py-5 px-3 text-right text-[10px] font-black text-slate-900 border border-slate-900 bg-slate-50">
                                {monthTotal > 1 ? monthTotal.toLocaleString() : '—'}
                            </td>
                        );
                    })}
                    <td className="py-5 px-6 text-right font-black text-slate-900 text-base tracking-tighter border border-slate-900 bg-slate-200">
                        {statement.grandSummary.totalBalance.toLocaleString()} <span className="text-[10px] ml-1">KES</span>
                    </td>
                 </tr>
              </tfoot>
            </table>
          </div>

          {/* Institutional Stamp Area */}
          <div className="mt-20 flex justify-end">
             <div className="flex flex-col items-center">
                <div className="h-32 w-32 border-4 border-dashed border-slate-200 rounded-full flex items-center justify-center mb-4">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center px-4 leading-relaxed">Official Institution Stamp Required</p>
                </div>
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">Institutional Verification</div>
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
          /* Reset borders for print */
          .border-slate-100 { border: none !important; }
          .bg-slate-100\/30 { background: white !important; }
          @page { margin: 1cm; size: a4 landscape; }
          table { border-collapse: collapse !important; width: 100% !important; }
          th, td { border: 1px solid #000 !important; }
        }
      `}</style>
    </div>
  );
}
