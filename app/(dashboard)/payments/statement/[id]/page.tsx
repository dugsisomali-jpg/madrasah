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
  ArrowRight,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import Swal from 'sweetalert2';
import { cn } from '@/lib/utils';

type PaymentInfo = {
  id: string;
  month: number;
  year: number;
  feeAmount: number;
  amountPaid: number;
  balance: number;
  exists: boolean;
};

type StudentStatement = {
  studentId: string;
  studentName: string;
  currentFee: number;
  payments: PaymentInfo[];
  summary: {
    totalPaid: number;
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
  const [settings, setSettings] = useState<Record<string, string>>({});
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

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const s: Record<string, string> = {};
          data.forEach(item => { s[item.key] = item.value; });
          setSettings(s);
        }
      });
  }, []);

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
        <p className="font-semibold text-slate-500 animate-pulse uppercase tracking-[0.2em] text-xs">Generating Statement...</p>
      </div>
    );
  }

  if (!statement) return <div className="p-10 text-center font-bold text-destructive">Failed to load statement.</div>;

  const firstStudent = statement.students[0];
  const monthKeys = firstStudent?.payments.map(p => `${p.year}-${String(p.month).padStart(2, '0')}`) || [];
  const monthLabels = firstStudent?.payments.map(p => `${MONTHS[p.month - 1]} ${String(p.year).slice(-2)}`) || [];

  return (
    <div className="min-h-screen bg-slate-100/30 p-4 md:p-8 print:p-0 print:bg-white overflow-y-auto custom-scrollbar italic-none">
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
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-xs font-black text-slate-600 shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50 uppercase tracking-widest"
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
          id="printable-statement"
          className="bg-white p-12 md:p-20 print:p-10 text-slate-900"
        >
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-slate-900 pb-12 mb-12 gap-10">
            <div className="flex flex-col gap-8">
               <div className="flex items-center gap-6">
                  <div className="h-20 w-20 flex items-center justify-center rounded-2xl bg-slate-900 text-white shadow-2xl p-2 overflow-hidden">
                     {settings.logo ? (
                        <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
                     ) : (
                        <FileText className="h-10 w-10 opacity-40" />
                     )}
                  </div>
                  <div>
                     <h1 className="text-4xl font-black tracking-tighter text-slate-900 leading-none uppercase mb-2">{settings.name || 'Madrasah'}</h1>
                     <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em]">Account Statement</p>
                  </div>
               </div>

               <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Period:</span>
                     <div className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase">
                        {from || 'All Time'}
                        <ArrowRight className="h-3 w-3 text-slate-300" />
                        {to || 'Present'}
                     </div>
                  </div>
                  {settings.address && (
                    <div className="flex items-start gap-2 mt-2">
                       <MapPin className="h-3.5 w-3.5 text-slate-300 mt-0.5" />
                       <p className="text-[11px] font-bold text-slate-500 uppercase leading-relaxed max-w-xs">{settings.address}</p>
                    </div>
                  )}
               </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-10 min-w-[250px]">
               <div className="text-left md:text-right">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Parent Name</p>
                  <div className="flex items-center gap-3 md:justify-end">
                     <User className="h-4 w-4 text-slate-400" />
                     <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{statement.parentName}</h2>
                  </div>
               </div>

               <div className="text-left md:text-right">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Generated On</p>
                  <div className="flex items-center gap-3 md:justify-end">
                     <Calendar className="h-4 w-4 text-slate-400" />
                     <p className="text-sm font-black text-slate-600 uppercase">{new Date(statement.generatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
               </div>

               <div className="flex flex-col gap-2 text-left md:text-right">
                  {settings.phone && (
                    <div className="flex items-center gap-2 md:justify-end">
                       <Phone className="h-3 w-3 text-slate-300" />
                       <p className="text-[11px] font-bold text-slate-500 uppercase">{settings.phone}</p>
                    </div>
                  )}
                  {settings.email && (
                    <div className="flex items-center gap-2 md:justify-end">
                       <Mail className="h-3 w-3 text-slate-300" />
                       <p className="text-[11px] font-bold text-slate-500 uppercase">{settings.email}</p>
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* Statement Matrix */}
          <div className="overflow-x-auto mb-16 rounded-xl border border-slate-900/10">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="py-6 px-6 text-[11px] font-black uppercase tracking-widest border-r border-slate-800 sticky left-0 bg-slate-900 z-10 w-[240px]">Student Registry</th>
                  {monthLabels.map((month, mIdx) => (
                    <th key={mIdx} className="py-6 px-4 text-[10px] font-black uppercase tracking-widest text-right border-r border-slate-800 whitespace-nowrap min-w-[90px]">
                      {month}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[11px] uppercase text-slate-900 font-bold">
                {statement.students.map((student, sIdx) => (
                  <tr key={sIdx} className={cn("hover:bg-slate-50 transition-colors", sIdx % 2 === 0 ? "bg-white" : "bg-slate-50/30")}>
                    <td className="py-5 px-6 border-r border-slate-100 sticky left-0 bg-inherit z-10 border-b border-slate-100">
                      {student.studentName}
                    </td>
                    {student.payments.map((p, pIdx) => (
                      <td key={pIdx} className="py-5 px-4 text-right border-r border-slate-100 border-b border-slate-100 whitespace-nowrap">
                        <div className="flex flex-col items-end gap-1">
                           <span className={p.amountPaid > 0 ? 'text-emerald-600' : 'text-slate-300'}>
                             {p.amountPaid > 0 ? p.amountPaid.toLocaleString() : '—'}
                           </span>
                           {p.balance > 0 && (
                             <span className="text-[9px] text-rose-500 font-black">
                               ({p.balance.toLocaleString()})
                             </span>
                           )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                 <tr className="bg-slate-50 font-black">
                    <td className="py-6 px-6 text-[11px] uppercase tracking-widest border-r border-slate-200 sticky left-0 bg-slate-50 z-10 border-t-2 border-slate-900">Total Monthly Paid</td>
                    {monthKeys.map((_, mkIdx) => {
                        const monthTotalPaid = statement.students.reduce((sum, s) => sum + s.payments[mkIdx].amountPaid, 0);
                        const monthTotalBal = statement.students.reduce((sum, s) => sum + s.payments[mkIdx].balance, 0);
                        return (
                            <td key={mkIdx} className="py-6 px-4 text-right border-r border-slate-200 border-t-2 border-slate-900">
                                <div className="flex flex-col items-end">
                                   <span className="text-[11px] text-emerald-700">{monthTotalPaid > 0 ? monthTotalPaid.toLocaleString() : '—'}</span>
                                   {monthTotalBal > 0 && <span className="text-[9px] text-rose-600">({monthTotalBal.toLocaleString()})</span>}
                                </div>
                            </td>
                        );
                    })}
                 </tr>
              </tfoot>
            </table>
          </div>

          {/* Institutional Recap */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-end">
             <div className="space-y-6">
                <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 inline-block min-w-[300px]">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Financial Summary</p>
                   <div className="space-y-4">
                      <div className="flex justify-between items-end">
                         <span className="text-xs font-bold text-slate-500 uppercase">Total Paid</span>
                         <span className="text-xl font-black text-emerald-600">KES {statement.grandSummary.totalPaid.toLocaleString()}</span>
                      </div>
                      <div className="h-px bg-slate-200" />
                      <div className="flex justify-between items-end">
                         <span className="text-xs font-bold text-slate-500 uppercase">Outstanding Balance</span>
                         <span className="text-xl font-black text-rose-500">KES {statement.grandSummary.totalBalance.toLocaleString()}</span>
                      </div>
                   </div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed max-w-sm">
                   Please verify all transactions. For discrepancies, contact the finance office with your original payment receipts.
                </p>
             </div>

             <div className="flex flex-col items-center md:items-end gap-6">
                <div className="h-40 w-40 border-4 border-dashed border-slate-100 rounded-full flex flex-col items-center justify-center p-4 text-center">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] leading-relaxed">Seal of Authenticity Required</p>
                </div>
                <div className="text-right border-t border-slate-900 pt-4 w-64">
                   <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none mb-2">Institutional Administrator</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest tracking-[0.4em]">Signature & Stamp</p>
                </div>
             </div>
          </div>

          <div className="mt-20 pt-8 border-t border-slate-50 text-center">
             <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.5em] italic">This is a system generated document. Manual stamp required for legal validity.</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          html, body { 
            height: auto !important; 
            overflow: visible !important; 
            background: white !important; 
          }
          body * { 
            visibility: hidden !important; 
          }
          #printable-statement, #printable-statement * { 
            visibility: visible !important; 
          }
          #printable-statement { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          @page { 
            margin: 0;
            size: a4 landscape; 
          }
          .custom-scrollbar::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
